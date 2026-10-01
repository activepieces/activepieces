import { Info } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type MetricCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: React.ReactNode;
  description: string;
  subtitle?: React.ReactNode;
  iconColor: string;
  iconBgColor: string;
};

export const MetricCard = ({
  icon: Icon,
  title,
  value,
  description,
  subtitle,
  iconColor,
  iconBgColor,
}: MetricCardProps) => {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-gray-11">
          {title}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3.5 shrink-0 cursor-help text-gray-11" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{description}</TooltipContent>
        </Tooltip>
        <div
          className={cn(
            'ml-auto flex size-8 shrink-0 items-center justify-center rounded-full',
            iconBgColor,
          )}
        >
          <Icon className={cn('size-4', iconColor)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-semibold text-gray-12 tabular-nums">
          {value}
        </div>
        {subtitle && <div className="text-xs text-gray-11">{subtitle}</div>}
      </div>
    </Card>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto size-8 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </Card>
  );
};
