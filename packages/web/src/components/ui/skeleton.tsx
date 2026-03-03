import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-neutral-700",
        className
      )}
      {...props}
    />
  )
}

function SkeletonList({
  className,
  numberOfItems = 3,
  ...props
}: React.ComponentProps<"div"> & {
  numberOfItems?: number
}) {
  const array = Array(numberOfItems).fill(null)
  return (
    <div className="space-y-3">
      {array.map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4 w-full", className)}
          {...props}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonList }
