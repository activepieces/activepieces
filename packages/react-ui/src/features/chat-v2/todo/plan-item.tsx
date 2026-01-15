import React from 'react';
import { cn } from '@/lib/utils';
import { Circle, CircleCheck } from 'lucide-react';

export type PlanItemStatus = 'not-started' | 'in-progress' | 'completed';

export interface PlanItemProps {
  text: string;
  status: PlanItemStatus;
  className?: string;
}

export function PlanItem({ text, status, className }: PlanItemProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <CircleCheck className="size-4 text-green-700 dark:text-green-200 shrink-0" />
        );
      case 'not-started':
      default:
        return (
          <Circle className="size-4 text-muted-foreground shrink-0" />
        );
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-foreground',
        className
      )}
    >
      {getStatusIcon()}
      <span
        className={cn(
          'flex-1',
          status === 'completed' && 'line-through'
        )}
      >
        {text}
      </span>
    </div>
  );
}

