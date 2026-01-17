import { Circle, CircleCheck, CircleDot, CircleDotDashed, CirclePlay } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PlanItem as PlanItemType } from '@activepieces/shared';


export interface PlanItemProps {
  text: string;
  status: PlanItemType['status'];
  className?: string;
}

export function PlanItem({ text, status, className }: PlanItemProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <CircleCheck className="size-4 text-green-700 dark:text-green-200 shrink-0" />
        );
      case 'in_progress':
        return (
          <CirclePlay className="size-4 text-yellow-700 dark:text-yellow-200 shrink-0 fill-current" />
        );
      case 'pending':
      default:
        return <CircleDotDashed className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-foreground',
        className,
      )}
    >
      {getStatusIcon()}
      <span className={cn('flex-1', status === 'completed' && 'line-through')}>
        {text}
      </span>
    </div>
  );
}
