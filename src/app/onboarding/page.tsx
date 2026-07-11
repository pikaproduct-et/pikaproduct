import { createSupplierProfile } from "./actions";
import { LocationCapture } from "./LocationCapture";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Tell us about your business
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This is what buyers will see once you&apos;re verified.
          </p>
        </div>

        {params.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {params.error}
          </div>
        )}

        <form action={createSupplierProfile} className="space-y-4">
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Business name
            </label>
            <input
              id="business_name"
              name="business_name"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Phone number (used for SMS stock updates)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+2519xxxxxxxx"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sub_city" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sub-city
              </label>
              <input
                id="sub_city"
                name="sub_city"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="woreda" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Woreda
              </label>
              <input
                id="woreda"
                name="woreda"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
          <input type="hidden" name="city" value="Addis Ababa" />

          <LocationCapture />

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
