import { t } from 'i18next';
import { Info } from 'lucide-react';
import { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { adminSurface } from './admin-surface';

export function StatCard({
  label,
  value,
  icon,
  info,
  hint,
  tone = 'default',
  className,
  children,
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(adminSurface.card, 'flex flex-col gap-2 p-5', className)}
    >
      <div className="flex items-center gap-2 text-sm text-gray-11">
        {icon && (
          <span className="flex shrink-0 [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t('More info')}
                className="flex shrink-0 rounded-sm text-gray-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        className={cn(
          'text-3xl font-semibold tracking-tight tabular-nums text-gray-12',
          tone === 'danger' && 'text-danger-11',
          tone === 'success' && 'text-success-11',
          tone === 'warning' && 'text-warning-11',
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-gray-11">{hint}</div>}
      {children}
    </div>
  );
}

export function StatGrid({ columns = 3, className, children }: StatGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  info?: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  children?: ReactNode;
};

type StatGridProps = {
  columns?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
};
