export default function ConsensusLoading() {
  return (
    <div className="min-h-screen pt-16 pb-16 px-6 max-w-[1400px] mx-auto">
      <div className="mb-8 pt-10">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse mb-2" />
        <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="flex gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-md bg-muted animate-pulse" />
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-md bg-muted animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
