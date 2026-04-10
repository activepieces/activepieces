import {
  AnalyticsTimePeriod,
  PlatformAnalyticsReport,
  ProjectLeaderboardItem,
  UserLeaderboardItem,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useContext } from 'react';

import { analyticsApi } from '@/features/platform-admin/api/analytics-api';
import { platformHooks } from '@/hooks/platform-hooks';

import { RefreshAnalyticsContext } from '../stores/refresh-analytics-context';

const analyticsQueryKey = ['analytics'];
const projectLeaderboardQueryKey = (timePeriod: AnalyticsTimePeriod) => [
  'project-leaderboard',
  timePeriod,
];
const userLeaderboardQueryKey = (timePeriod: AnalyticsTimePeriod) => [
  'user-leaderboard',
  timePeriod,
];

export const platformAnalyticsHooks = {
  useUsersLeaderboard: (
    timePeriod: AnalyticsTimePeriod,
  ): { data: UserLeaderboardItem[] | null; isLoading: boolean } => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data, isLoading } = useQuery({
      queryKey: userLeaderboardQueryKey(timePeriod),
      queryFn: () => analyticsApi.getUserLeaderboard(timePeriod),
      enabled: platform.plan.analyticsEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });

    return {
      data: data ?? null,
      isLoading,
    };
  },

  useProjectLeaderboard: (
    timePeriod: AnalyticsTimePeriod,
  ): { data: ProjectLeaderboardItem[] | null; isLoading: boolean } => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data, isLoading } = useQuery({
      queryKey: projectLeaderboardQueryKey(timePeriod),
      queryFn: () => analyticsApi.getProjectLeaderboard(timePeriod),
      enabled: platform.plan.analyticsEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });

    return {
      data: data ?? null,
      isLoading,
    };
  },

  useAnalytics: (): {
    data: PlatformAnalyticsReport | undefined;
    isLoading: boolean;
  } => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data, isLoading } = useQuery({
      queryKey: analyticsQueryKey,
      queryFn: () => analyticsApi.get(),
      enabled: platform.plan.analyticsEnabled,
    });
    return { data, isLoading };
  },

  useAnalyticsTimeBased: (
    timePeriod: AnalyticsTimePeriod,
    projectId?: string,
  ): { isLoading: boolean; data: PlatformAnalyticsReport | null } => {
    const selectFilteredByProject = useCallback(
      (report: PlatformAnalyticsReport) => {
        if (!projectId) {
          return report;
        }
        const flows = report.flows.filter(
          (flow) => flow.projectId === projectId,
        );
        const runs = report.runs.filter((run) =>
          flows.some((flow) => flow.flowId === run.flowId),
        );
        return {
          ...report,
          flows,
          runs,
        };
      },
      [projectId],
    );

    const { platform } = platformHooks.useCurrentPlatform();
    const { data, isLoading } = useQuery({
      queryKey: [...analyticsQueryKey, timePeriod],
      queryFn: () => analyticsApi.get(timePeriod),
      select: selectFilteredByProject,
      enabled: platform.plan.analyticsEnabled,
    });

    return {
      isLoading,
      data: data ?? null,
    };
  },

  useRefreshAnalytics: () => {
    const queryClient = useQueryClient();
    const { setIsRefreshing } = useContext(RefreshAnalyticsContext);
    return useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        return analyticsApi.refresh();
      },
      onSuccess: () => {
        setIsRefreshing(false);
        queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
        queryClient.invalidateQueries({ queryKey: ['project-leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['user-leaderboard'] });
      },
      retry: true,
      retryDelay: 50000,
    });
  },
};
