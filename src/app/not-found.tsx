import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
          DREC PMS
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
          Page not found
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
