import { useContext, useMemo } from 'react';

import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { PlatformAnalyticsReport } from '@activepieces/shared';

export type FlowDetailRow = PlatformAnalyticsReport['flows'][number] & {
  id: string;
  runs: number;
  minutesSaved: number;
};

export type Owner = { id: string; name: string };

export function useFlowDetailsData(report?: PlatformAnalyticsReport) {
  const { timeSavedPerRunOverrides, setTimeSavedPerRunOverride } =
    useContext(RefreshAnalyticsContext);

  const runsMap = useMemo(() => {
    if (!report) return new Map<string, number>();
    return new Map(report.runs.map((run) => [run.flowId, run.runs ?? 0]));
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

  const uniqueOwners = useMemo((): Owner[] => {
    if (!flowDetails) return [];
    const ownerMap = new Map<string, Owner>();
    flowDetails.forEach((flow) => {
      if (flow.ownerId && !ownerMap.has(flow.ownerId)) {
        ownerMap.set(flow.ownerId, {
          id: flow.ownerId,
          name: flow.ownerId,
        });
      }
    });
    return Array.from(ownerMap.values());
  }, [flowDetails]);

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
