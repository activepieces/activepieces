import {
  PlatformAnalyticsReport,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { QueryObserverResult, useQueries } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

import { userApi } from '@/api/user-api';
import { RefreshAnalyticsContext } from '@/features/platform-admin';

import { impactOwnersUtils, Owner } from './impact-owners-utils';
import { impactRunsUtils } from './impact-runs-utils';

export type FlowDetailRow = PlatformAnalyticsReport['flows'][number] & {
  id: string;
  runs: number;
  minutesSaved: number;
};

export function useFlowDetailsData(report?: PlatformAnalyticsReport) {
  const { timeSavedPerRunOverrides, setTimeSavedPerRunOverride } = useContext(
    RefreshAnalyticsContext,
  );

  const runsMap = useMemo(() => {
    if (!report) return new Map<string, number>();
    return impactRunsUtils.sumRunsByFlow(report.runs);
  }, [report]);

  const flowDetails = useMemo((): FlowDetailRow[] | undefined => {
    if (!report) return undefined;
    return report.flows.map((flow) => {
      const override = timeSavedPerRunOverrides[flow.flowId];
      const timeSavedPerRun = override?.value ?? flow.timeSavedPerRun;
      const runs = runsMap.get(flow.flowId) ?? 0;
      return {
        ...flow,
        id: flow.flowId,
        timeSavedPerRun,
        runs,
        minutesSaved: (timeSavedPerRun ?? 0) * runs,
      };
    });
  }, [report, timeSavedPerRunOverrides, runsMap]);

  const missingOwnerIds = useMemo(
    () =>
      report ? impactOwnersUtils.listOwnerIdsMissingFromUsers(report) : [],
    [report],
  );

  const missingOwnerUsers = useQueries({
    queries: missingOwnerIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => userApi.getUserById(id),
      staleTime: Infinity,
    })),
    combine: collectLoadedUsers,
  });

  const uniqueOwners = useMemo((): Owner[] => {
    if (!report) return [];
    return impactOwnersUtils.listFlowOwners({
      flows: report.flows,
      users: [...report.users, ...missingOwnerUsers],
    });
  }, [report, missingOwnerUsers]);

  const flowsMissingTimeSaved = useMemo(() => {
    if (!flowDetails) return 0;
    return flowDetails.filter(
      (flow) => flow.timeSavedPerRun === null || flow.timeSavedPerRun === 0,
    ).length;
  }, [flowDetails]);

  return {
    flowDetails,
    uniqueOwners,
    flowsMissingTimeSaved,
    timeSavedPerRunOverrides,
    setTimeSavedPerRunOverride,
  };
}

function collectLoadedUsers(
  results: QueryObserverResult<UserWithMetaInformation>[],
): UserWithMetaInformation[] {
  return results.flatMap(({ data }) => (data ? [data] : []));
}
