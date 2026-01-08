import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';

import { RefreshAnalyticsContext } from './refresh-analytics-context';
import { PlatformAnalyticsReport } from '@activepieces/shared';
import dayjs from 'dayjs';
import { projectCollectionUtils } from '@/hooks/project-collection';

const queryKey = ['analytics'];

export enum TimePeriod {
  LAST_WEEK = 'last-week',
  LAST_MONTH = 'last-month',
  LAST_THREE_MONTHS = 'last-3-months',
  ALL_TIME = 'all-time',
}

export type ProjectLeaderboardItem = {
  projectId: string;
  projectName: string;
  flowCount: number;
  minutesSaved: number;
}

export type UserLeaderboardItem = {
  userId: string;
  flowCount: number;
  minutesSaved: number;
}

export const platformAnalyticsHooks = {
  useUsersLeaderboard: (timePeriod: TimePeriod) => {
    const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
    if (isLoading) {
      return {
        data: null,
        isLoading: isLoading,
      };
    }
    const users = data?.users ?? [];
    return users.map(user => {
      const flowCount = data?.flows.filter(flow => flow.ownerId === user.id).length;
      const flowIds = data?.flows.map(flow => flow.flowId) ?? [];
      const minutesSaved = calculateTimeSaved(flowIds, data!, timePeriod);
      return {
        userId: user.id,
        flowCount: flowCount,
        minutesSaved: minutesSaved,
      };
    });
  },
  useProjectLeaderboard: (timePeriod: TimePeriod) => {
    const { data, isLoading } = platformAnalyticsHooks.useAnalytics();
    const projects = projectCollectionUtils.useAll();
    if (isLoading) {
      return {
        data: null,
        isLoading: isLoading,
      };
    }
    return projects.data.map(project => {
      const flowCount = data?.flows.filter(flow => flow.projectId === project.id).length;
      const flowIds = data?.flows.map(flow => flow.flowId) ?? [];
      const minutesSaved = calculateTimeSaved(flowIds, data!, timePeriod);
      return {
        projectId: project.id,
        projectName: project.displayName,
        flowCount: flowCount,
        minutesSaved: minutesSaved,
      };
    });
  },
  useAnalytics: () => {
    const { data, isLoading } = useQuery({
      queryKey,
      queryFn: () => analyticsApi.get(),
    });
    return { data, isLoading };
  },
  useRefreshAnalytics: () => {
    const queryClient = useQueryClient();
    const { setIsRefreshing } = useContext(RefreshAnalyticsContext);
    return useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        return analyticsApi.refresh();
      },
      onSuccess: (result) => {
        setIsRefreshing(false);
        queryClient.setQueryData(queryKey, result);
      },
      retry: true,
      retryDelay: 50000,
    });
  },
};

function getDateRange(timePeriod: TimePeriod): string {
  let date = dayjs();
  switch (timePeriod) {
    case TimePeriod.LAST_WEEK:
      return date.subtract(1, 'week').startOf('day').toISOString();
    case TimePeriod.LAST_MONTH:
      return date.subtract(1, 'month').startOf('day').toISOString();
    case TimePeriod.LAST_THREE_MONTHS:
      return date.subtract(3, 'months').startOf('day').toISOString();
    case TimePeriod.ALL_TIME:
      return date.subtract(10, 'year').startOf('day').toISOString();
    default:
      throw new Error(`Invalid time period: ${timePeriod}`);
  }
}

function calculateTimeSaved(flowIds: string[], analytics: PlatformAnalyticsReport, timePeriod: TimePeriod): number | null {
  const flowsWithTimeSaved = analytics.flows.filter((flow) => flowIds.includes(flow.flowId) && flow.timeSavedPerRun !== null);
  if (flowsWithTimeSaved.length === 0) {
    return null;
  }
  return flowsWithTimeSaved.reduce((acc, flow) => {
    const timeSavedPerRun = flow.timeSavedPerRun ?? 0;
    const totalRuns = analytics.runs
      .filter((run) => dayjs(run.day).isAfter(dayjs(getDateRange(timePeriod))) && run.flowId === flow.flowId)
      .reduce((sum, run) => sum + (run.runs ?? 0), 0);
    return acc + timeSavedPerRun * totalRuns;
  }, 0);
}