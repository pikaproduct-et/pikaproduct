/** Click-to-call / click-to-WhatsApp — deliberately first-class, not
 * buried in a profile page. Ethiopian B2B buying is relationship- and
 * voice-driven; forcing an in-app checkout would fight that instead of
 * working with it. See blueprint Section 1. */
export function ContactButtons({ phone }: { phone: string }) {
  const whatsappNumber = phone.replace(/[^\d]/g, "");

  return (
    <div className="flex gap-2">
      <a
        href={`tel:${phone}`}
        className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Call
      </a>
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 rounded-md border border-green-600 px-3 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
      >
        WhatsApp
      </a>
    </div>
  );
}
