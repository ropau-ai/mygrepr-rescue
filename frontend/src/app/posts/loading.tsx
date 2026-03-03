export default function PostsLoading() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse mb-2" />
          <div className="h-4 w-64 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-20 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>

        {/* Results count skeleton */}
        <div className="h-4 w-24 rounded-md bg-muted animate-pulse mb-4" />

        {/* Cards grid skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-muted animate-pulse mb-1.5" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-1.5" />
              <div className="h-3 w-full rounded bg-muted animate-pulse mb-1" />
              <div className="h-3 w-full rounded bg-muted animate-pulse mb-1" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse mb-2" />
              <div className="flex items-center gap-3">
                <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                <div className="h-3 w-10 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
