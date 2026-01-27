export default function PartsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded-full bg-surface-200" />
        <div className="h-8 w-64 rounded-xl bg-surface-200" />
        <div className="h-4 w-96 rounded-xl bg-surface-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <div className="h-[520px] rounded-2xl border border-surface-200 bg-white/70" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-2xl border border-surface-200 bg-white/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
