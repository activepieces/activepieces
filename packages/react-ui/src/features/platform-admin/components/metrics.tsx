import { t } from 'i18next';
import { Building, User, Workflow, Puzzle, Bot, Info } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type MetricProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: React.ReactNode;
  description: string;
  footer?: string;
  iconColor: string;
};

const Metric = ({
  icon: Icon,
  title,
  value,
  description,
  footer,
  iconColor,
}: MetricProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground " />
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </div>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        {footer && (
          <div className="text-sm text-muted-foreground mt-2">{footer}</div>
        )}
      </CardContent>
    </Card>
  );
};

const SkeletonMetric = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
};

type MetricsProps = {
  report?: PlatformAnalyticsReport;
};

export function Metrics({ report }: MetricsProps) {
  const metricsData = [
    {
      icon: Workflow,
      title: t('Active Flows'),
      value: report?.activeFlows,
      description: t('The number of enabled flows in the platform'),
      footer: report ? `Out of ${report.totalFlows} total flows` : null,
      iconColor: 'text-cyan-700',
    },
    {
      icon: Building,
      title: t('Active Projects'),
      value: report?.activeProjects,
      description: t('The number of projects with at least one enabled flow'),
      footer: report ? `Out of ${report.totalProjects} total projects` : null,
      iconColor: 'text-pink-700',
    },
    {
      icon: User,
      title: t('Active Users'),
      value: report?.activeUsers,
      description: t('The number of users logged in the last 30 days'),
      footer: report
        ? t(`Out of {totalusers} total users`, {
            totalusers: report.totalUsers,
          })
        : null,
      iconColor: 'text-indigo-700',
    },
    {
      icon: Puzzle,
      title: t('Pieces Used'),
      value: report?.uniquePiecesUsed,
      description: t('The number of unique pieces used across all flows'),
      iconColor: 'text-green-700',
    },
    {
      icon: Bot,
      title: t('Flows with AI'),
      value: report?.activeFlowsWithAI,
      description: t('The number of enabled flows that use AI pieces'),
      iconColor: 'text-purple-700',
    },
  ];

  return (
    <div>
      <div className="text-xl font-semibold ">{t('Metrics')}</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {report
          ? metricsData.map((metric, index) => (
              <Metric
                key={index}
                icon={metric.icon}
                title={metric.title}
                value={metric.value}
                description={metric.description}
                footer={metric.footer ?? undefined}
                iconColor={metric.iconColor}
              />
            ))
          : Array.from({ length: metricsData.length }).map((_, index) => (
              <SkeletonMetric key={index} />
            ))}
      </div>
    </div>
  );
}
