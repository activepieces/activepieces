import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

export function BackLink({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-fit items-center gap-1.5 text-sm font-medium text-gray-11 transition-colors hover:text-gray-12',
        className,
      )}
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
      {label}
    </button>
  );
}
