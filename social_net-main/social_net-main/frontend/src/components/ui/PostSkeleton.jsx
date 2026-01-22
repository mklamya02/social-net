export function PostSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-card border rounded-3xl p-6 animate-pulse">
      {/* Author skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      
      {/* Engagement skeleton */}
      <div className="flex items-center gap-6 pt-2">
        <div className="h-5 bg-muted rounded w-12" />
        <div className="h-5 bg-muted rounded w-12" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
    </div>
  );
}
