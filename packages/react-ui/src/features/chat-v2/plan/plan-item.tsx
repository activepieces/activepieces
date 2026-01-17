import { CircleCheck, CircleDotDashed, CirclePlay } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PlanItem as PlanItemType } from '@activepieces/shared';

export interface PlanItemProps {
  text: string;
  status: PlanItemType['status'];
  className?: string;
}

export function PlanItem({ text, status, className }: PlanItemProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <CircleCheck className="size-4 text-green-700 dark:text-green-200 shrink-0" />
        );
      case 'in_progress':
        return (
          <CirclePlay className="size-4 text-yellow-700 dark:text-yellow-200 shrink-0" />
        );
      case 'pending':
      default:
        return <CircleDotDashed className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-foreground min-w-0',
        className,
      )}
      onMouseEnter={checkTruncation}
    >
      {getStatusIcon()}
      <span
        ref={textRef}
        className={cn('truncate', status === 'completed' && 'line-through')}
      >
        {text}
      </span>
    </div>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px]">
        <p className="text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
