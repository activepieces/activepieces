import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import React from 'react';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type MetricCardProps = {
  icon: IconSvgElement;
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
    <Card className="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-11">{title}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="h-3.5 w-3.5 text-gray-11 cursor-help"
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{description}</TooltipContent>
          </Tooltip>
          <div
            className={cn(
              'size-8 rounded-full flex items-center justify-center shrink-0 ml-auto',
              iconBgColor,
            )}
          >
            <HugeiconsIcon icon={Icon} className={cn('size-4', iconColor)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold text-gray-12">{value}</div>
          {subtitle && <div className="text-sm text-gray-11">{subtitle}</div>}
        </div>
      </div>
    </Card>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="size-9 rounded-full shrink-0" />
      </div>
    </Card>
  );
};
