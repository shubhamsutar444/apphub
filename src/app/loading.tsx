import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="section-container py-32">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto mt-8 h-16 w-full max-w-3xl" />
        <Skeleton className="mx-auto mt-4 h-6 w-full max-w-xl" />
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
