import Link from "next/link";

export default function Home() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          PikaProduct
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Hyper-local, real-time inventory marketplace for engineering commodities.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          Supabase env vars:{" "}
          <span className={supabaseConfigured ? "text-green-600" : "text-amber-600"}>
            {supabaseConfigured ? "configured" : "not set — see .env.example"}
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Supplier sign in
        </Link>
      </main>
    </div>
  );
}
