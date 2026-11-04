function successRate({
  successRuns,
  failureRuns,
}: {
  successRuns: number;
  failureRuns: number;
}): number {
  const totalRuns = successRuns + failureRuns;
  const percentage = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 100;
  return Number(percentage.toFixed(1));
}

function compareWorstFirst(a: HealthRow, b: HealthRow): number {
  return (
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    a.last24Hours - b.last24Hours ||
    a.last7Days - b.last7Days ||
    a.last14Days - b.last14Days ||
    a.id.localeCompare(b.id)
  );
}

export const triggerHealthUtils = { successRate, compareWorstFirst };

type HealthRow = {
  id: string;
  status: string;
  last24Hours: number;
  last7Days: number;
  last14Days: number;
};

const STATUS_RANK: Record<string, number> = {
  fault: 0,
  warning: 1,
  success: 2,
};
