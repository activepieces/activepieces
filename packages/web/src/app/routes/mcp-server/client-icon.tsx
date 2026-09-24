import { cn } from '@/lib/utils';

export function ClientIcon({
  icon,
  className = 'size-8',
}: {
  icon: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <img src={icon} alt="" className="size-[62%]" />
    </span>
  );
}
