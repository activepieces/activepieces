import { Info } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type MetricCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: React.ReactNode;
  description: string;
  subtitle?: string;
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
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{description}</TooltipContent>
          </Tooltip>
          <div
            className={`size-8 rounded-full ${iconBgColor} flex items-center justify-center shrink-0 ml-auto`}
          >
            <Icon className={`size-4 ${iconColor}`} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {subtitle && (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          )}
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
