export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 rounded-md bg-muted animate-pulse mb-2" />
          <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="h-3 w-20 rounded bg-muted animate-pulse mb-2" />
              <div className="h-7 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* ETF section skeleton */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="h-5 w-32 rounded bg-muted animate-pulse mb-3" />
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>

        {/* Recent posts grid skeleton */}
        <div className="h-5 w-28 rounded bg-muted animate-pulse mb-3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="h-4 w-16 rounded bg-muted animate-pulse mb-2" />
              <div className="h-4 w-full rounded bg-muted animate-pulse mb-1" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-full rounded bg-muted animate-pulse mb-1" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
