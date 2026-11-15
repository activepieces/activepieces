export const USAGE_METRICS: UsageMetric[] = ['spend', 'calls', 'tokens'];

export type UsageMetric = 'spend' | 'calls' | 'tokens';

export type UsagePoint = {
  label: string;
  current: number | null;
  previous: number | null;
};
