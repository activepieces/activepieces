import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, Workflow, Puzzle, Bot } from 'lucide-react';
import { AnalyticsReportResponse } from '@activepieces/shared';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type MetricProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  submetrics: {
    title: string;
    value: React.ReactNode;
    description: string;
  }[];
};
const MultipleMetrics = ({ icon: Icon, title, submetrics }: MetricProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold">{title}</div>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="grid items-center gap-4">
          {submetrics.map((submetric, index) => (
            <div key={index} className="grid flex-1 auto-rows-min gap-1">
              <div className="flex items-center text-sm">
                {submetric.title}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {submetric.description}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                {submetric.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

type SingleMetricsProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: React.ReactNode;
  description: string;
}

const Metric = ({ icon: Icon, title, value, description }: SingleMetricsProps) => {
  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              {description}
            </TooltipContent>
          </Tooltip>
        </div>
        <Icon className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

type MetricsProps = {
  report: AnalyticsReportResponse
}
export function Metrics({ report }: MetricsProps) {
  return (
    <div>
      <div className="text-xl font-semibold ">Metrics</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MultipleMetrics
          icon={Workflow}
          title="Flow"
          submetrics={[
            {
              title: "Active Flows",
              value: report.activeFlows,
              description: 'The number of active flows in the platform'
            },
            {
              title: "Total Flows",
              value: report.totalFlows,
              description: 'The total number of flows in the platform'
            }
          ]}
        />
        <MultipleMetrics
          icon={Building}
          title="Project"
          submetrics={[
            {
              title: "Active Projects",
              value: report.activeProjects,
              description: 'The number of active projects in the platform'
            },
            {
              title: "Total Projects",
              value: report.totalProjects,
              description: 'The total number of projects in the platform'
            }
          ]}
        />
        <MultipleMetrics
          icon={User}
          title="Users"
          submetrics={[
            {
              title: "Active Users",
              value: report.activeUsers,
              description: 'The number of users logged in the last 30 days'
            },
            {
              title: "Total Users",
              value: report.totalUsers,
              description: 'The total number of users in the platform'
            }
          ]}
        />

        <Metric
          icon={Puzzle}
          title="Pieces Used"
          value={report.uniquePiecesUsed}
          description='The number of unique pieces used across all flows'
        />
        <Metric
          icon={Bot}
          title="Flows with AI"
          value={report.activeFlowsWithAI}
          description='The number of flows that incorporate AI components'
        />
      </div>
    </div>
  );
}
