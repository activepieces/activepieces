import { cn } from '@/lib/utils';

export function SectionHeading({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-xss font-semibold tracking-wider text-gray-11 uppercase">
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
