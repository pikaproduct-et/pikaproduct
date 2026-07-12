import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { applyStockUpdate } from "@/lib/stock/update-stock";
import { sendSms } from "@/lib/sms/notify";

/**
 * Inbound SMS webhook — the "structured SMS format" fallback described in
 * the blueprint for suppliers who won't use the app UI. Written against
 * Africa's Talking's inbound-message webhook shape (form-encoded `from`,
 * `to`, `text`), the most common SMS gateway for East Africa. Swapping
 * providers later should only mean changing how this route parses the
 * request body — everything past that point is provider-agnostic.
 *
 * Expected message format: "STOCK <CODE> <QUANTITY>", e.g. "STOCK REBAR12 50".
 * <CODE> matches products.sms_code (see migration 0003).
 *
 * Uses the admin/service-role client because there's no logged-in user on
 * an inbound SMS — authorization instead comes from matching the sender's
 * phone number to a supplier record, done explicitly below.
 */

function normalizePhone(raw: string): string {
  // Ethiopian numbers arrive from gateways in a few shapes
  // (+2519..., 2519..., 09...) — normalize to +2519xxxxxxxx / +2517xxxxxxxx.
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("2519") || digits.startsWith("2517")) return `+${digits}`;
  if (digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.startsWith("9") || digits.startsWith("7")) return `+251${digits}`;
  return raw;
}

function parseCommand(text: string): { code: string; quantity: number } | null {
  const match = text.trim().match(/^STOCK\s+([A-Z0-9]+)\s+([\d.]+)$/i);
  if (!match) return null;
  const quantity = Number(match[2]);
  if (Number.isNaN(quantity) || quantity < 0) return null;
  return { code: match[1].toUpperCase(), quantity };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let from: string | null = null;
  let text: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    from = body.from ?? null;
    text = body.text ?? null;
  } else {
    const form = await request.formData();
    from = (form.get("from") as string) ?? null;
    text = (form.get("text") as string) ?? null;
  }

  if (!from || !text) {
    return NextResponse.json({ error: "Missing from/text" }, { status: 400 });
  }

  const command = parseCommand(text);
  if (!command) {
    await sendSms(from, 'Sorry, we could not read that. Format: "STOCK <CODE> <QTY>"');
    return NextResponse.json({ status: "ignored", reason: "unparseable" });
  }

  const supabase = createAdminClient();
  const phone = normalizePhone(from);

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!supplier) {
    await sendSms(from, "This number isn't registered as a PikaProduct supplier yet.");
    return NextResponse.json({ status: "ignored", reason: "unknown_supplier" });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("sms_code", command.code)
    .maybeSingle();

  if (!product) {
    await sendSms(from, `Unknown product code "${command.code}".`);
    return NextResponse.json({ status: "ignored", reason: "unknown_product" });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("supplier_id", supplier.id)
    .eq("product_id", product.id)
    .maybeSingle();

  if (!listing) {
    await sendSms(
      from,
      `You haven't listed ${product.name} yet — add it in the app first, then text updates.`
    );
    return NextResponse.json({ status: "ignored", reason: "no_listing" });
  }

  await applyStockUpdate(supabase, {
    listingId: listing.id,
    quantity: command.quantity,
    confidenceTimestamp: new Date().toISOString(),
    source: "sms",
  });

  await sendSms(from, `Updated ${product.name} to ${command.quantity}. Thanks!`);
  return NextResponse.json({ status: "ok" });
}
