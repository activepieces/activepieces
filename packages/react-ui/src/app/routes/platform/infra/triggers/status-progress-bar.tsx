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
      {[...days].reverse().map((day, index) => {
        const totalRuns = day.success + day.failure;
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'w-3 h-6 rounded-sm cursor-pointer transition-colors',
                  'hover:scale-110 hover:shadow-sm',
                  {
                    'bg-emerald-500 hover:bg-emerald-600':
                      day.status === 'success',
                    'bg-destructive hover:bg-destructive/80':
                      day.status === 'fault',
                    'bg-yellow-400 hover:bg-yellow-500':
                      day.status === 'warning',
                  },
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="text-xs">
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
