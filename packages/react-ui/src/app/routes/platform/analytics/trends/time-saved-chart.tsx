'use client';

import dayjs from 'dayjs';
import { t } from 'i18next';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { LineChart, CartesianGrid, XAxis, Line } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DateTimePickerWithRange } from '@/components/ui/date-time-picker-range';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedChart({ report }: TimeSavedChartProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >({
    from: dayjs().subtract(3, 'months').toDate(),
    to: dayjs().toDate(),
  });

  const chartData =
    report?.runsUsage
      .map((data) => ({
        date: data.day,
        minutesSaved: data.minutesSaved,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    minutesSaved: {
      label: t('Minutes Saved'),
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
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {t('Time Saved Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track how much time your automations are saving')}
          </p>
        </div>
        <DateTimePickerWithRange
          onChange={setSelectedDateRange}
          from={selectedDateRange?.from?.toISOString()}
          to={selectedDateRange?.to?.toISOString()}
          maxDate={new Date()}
          presetType="past"
        />
      </CardHeader>
      <CardContent className="pt-4">
        {report ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                    nameKey="minutesSaved"
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
              <Line
                dataKey="minutesSaved"
                type="monotone"
                stroke="var(--color-minutesSaved)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <Skeleton className="h-[300px] w-full" />
        )}
      </CardContent>
    </Card>
  );
}
