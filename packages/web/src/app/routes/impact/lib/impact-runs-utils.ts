import { PlatformAnalyticsReport } from '@activepieces/shared';

function sumRunsByFlow(
  runs: PlatformAnalyticsReport['runs'],
): Map<string, number> {
  return runs.reduce((totals, run) => {
    totals.set(run.flowId, (totals.get(run.flowId) ?? 0) + (run.runs ?? 0));
    return totals;
  }, new Map<string, number>());
}

function sumByDay({
  report,
  valueOf,
}: {
  report: PlatformAnalyticsReport;
  valueOf: (run: PlatformAnalyticsReport['runs'][number]) => number;
}): DailyTotal[] {
  const totals = report.runs.reduce((acc, run) => {
    acc.set(run.day, (acc.get(run.day) ?? 0) + valueOf(run));
    return acc;
  }, new Map<string, number>());
  return Array.from(totals.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function runsByDay(report: PlatformAnalyticsReport): DailyTotal[] {
  return sumByDay({ report, valueOf: (run) => run.runs ?? 0 });
}

function secondsSavedByDay(report: PlatformAnalyticsReport): DailyTotal[] {
  const perRun = new Map(
    report.flows.map((flow) => [flow.flowId, flow.timeSavedPerRun ?? 0]),
  );
  return sumByDay({
    report,
    valueOf: (run) => (perRun.get(run.flowId) ?? 0) * (run.runs ?? 0),
  });
}

function secondsSavedBy({
  report,
  groupBy,
}: {
  report: PlatformAnalyticsReport;
  groupBy: 'project' | 'flow';
}): GroupTotal[] {
  const runsByFlow = sumRunsByFlow(report.runs);
  const totals = report.flows.reduce((acc, flow) => {
    const seconds =
      (flow.timeSavedPerRun ?? 0) * (runsByFlow.get(flow.flowId) ?? 0);
    if (seconds <= 0) {
      return acc;
    }
    const key = groupBy === 'project' ? flow.projectId : flow.flowId;
    const label = groupBy === 'project' ? flow.projectName : flow.flowName;
    acc.set(key, { key, label, value: (acc.get(key)?.value ?? 0) + seconds });
    return acc;
  }, new Map<string, GroupTotal>());
  return Array.from(totals.values()).sort((a, b) => b.value - a.value);
}

export const impactRunsUtils = {
  sumRunsByFlow,
  runsByDay,
  secondsSavedByDay,
  secondsSavedBy,
};

type DailyTotal = { date: string; value: number };

type GroupTotal = { key: string; label: string; value: number };
