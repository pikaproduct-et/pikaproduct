import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/is-admin";
import { signOut } from "@/app/login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/suppliers");
  }

  const admin = await isAdmin(supabase);
  if (!admin) {
    // Deliberately vague — don't confirm/deny whether /admin exists to a
    // signed-in non-admin any more than necessary.
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/admin/suppliers" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            PikaProduct Admin
          </Link>
          <form action={signOut}>
            <button className="text-sm text-zinc-500 underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
