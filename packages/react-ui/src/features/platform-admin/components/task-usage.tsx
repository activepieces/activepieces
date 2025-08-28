'use client';

import dayjs from 'dayjs';
import { t } from 'i18next';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { BarChart, CartesianGrid, XAxis, Bar } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DateTimePickerWithRange } from '@/components/ui/date-time-picker-range';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type TaskUsageProps = {
  report?: PlatformAnalyticsReport;
};

export function TaskUsage({ report }: TaskUsageProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >({
    from: dayjs().subtract(3, 'months').toDate(),
    to: dayjs().toDate(),
  });

  const chartData =
    report?.tasksUsage
      .map((data) => ({
        date: data.day,
        tasks: data.totalTasks,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    views: {
      label: 'Task Executions',
    },
    tasks: {
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  const filteredData = chartData.filter((data) => {
    if (!selectedDateRange?.from || !selectedDateRange?.to) {
      return true;
    }
    const date = new Date(data.date);
    return date >= selectedDateRange.from && date <= selectedDateRange.to;
  });

  return (
    <>
      <div className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <div className="text-xl font-semibold ">{t('Executed Tasks')}</div>
          <p>{t('Showing total executed tasks for specified time range')}</p>
        </div>
        <DateTimePickerWithRange
          onChange={setSelectedDateRange}
          from={selectedDateRange?.from?.toISOString()}
          to={selectedDateRange?.to?.toISOString()}
          maxDate={new Date()}
          presetType="past"
        />
      </div>
      <div className="px-2 pt-4 sm:px-6 sm:pt-6">
        {report ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                  />
                }
              />
              <Bar dataKey={'tasks'} fill={`var(--color-tasks)`} />
            </BarChart>
          </ChartContainer>
        ) : (
          <Skeleton className="h-[250px] w-full" />
        )}
      </div>
    </>
  );
}
