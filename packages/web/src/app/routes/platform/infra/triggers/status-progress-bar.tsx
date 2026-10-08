import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type DayStatus = {
  date: string;
  success: number;
  failure: number;
  status: 'success' | 'warning' | 'fault';
};

interface StatusProgressBarProps {
  days: DayStatus[];
  className?: string;
}

export function StatusProgressBar({ days, className }: StatusProgressBarProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {[...days].reverse().map((day) => {
        const totalRuns = day.success + day.failure;
        return (
          <Tooltip key={day.date}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'h-6 w-3 rounded-sm transition-opacity hover:opacity-80',
                  day.status === 'success' && 'bg-success-10',
                  day.status === 'fault' && 'bg-danger-10',
                  day.status === 'warning' && 'bg-warning-10',
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <div>
                On {day.date}, there were {totalRuns} total runs: {day.success}{' '}
                succeeded and {day.failure} failed.
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
