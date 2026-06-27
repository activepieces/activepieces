import { cn } from '@/lib/utils';

export function VerticalFlowIcon({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn(className)}
    >
      <rect x="5" y="3" width="14" height="6" rx="2" />
      <path d="M12 9v6" />
      <rect x="5" y="15" width="14" height="6" rx="2" />
    </svg>
  );
}
