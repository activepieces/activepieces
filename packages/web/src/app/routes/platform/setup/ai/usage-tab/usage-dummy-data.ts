import { AIProviderName } from '@activepieces/core-utils';

function buildSummary({
  period,
  groupBy,
  includeTestRuns,
}: BuildSummaryParams): UsageSummary {
  const scale = PERIOD_SCALE[period] * (includeTestRuns ? 1.12 : 1);
  const random = seededRandom({
    seed: `${period}:${groupBy}:${includeTestRuns}`,
  });
  const rows = ROWS_BY_GROUP[groupBy].map((template) =>
    rowFrom({ template, scale, random }),
  );
  const points = pointLabels({ period }).map((label) =>
    pointFrom({ label, scale: scale / pointLabels({ period }).length, random }),
  );
  return {
    totals: totalsOf({ rows }),
    points,
    rows: [...rows].sort(
      (a, b) => spendUsdOf({ row: b }) - spendUsdOf({ row: a }),
    ),
    dataThroughMinutesAgo: 2,
    trackingSince: '2026-10-18',
    creditUsdValue: CREDIT_USD_VALUE,
  };
}

function rowFrom({
  template,
  scale,
  random,
}: {
  template: RowTemplate;
  scale: number;
  random: () => number;
}): UsageRow {
  const weight = template.weight * scale * (0.85 + random() * 0.3);
  const calls = Math.round(weight * 420);
  const inputTokens = Math.round(calls * (1800 + random() * 2400));
  const outputTokens = Math.round(calls * (240 + random() * 360));
  const cacheReadTokens = Math.round(inputTokens * (0.2 + random() * 0.4));
  const ownKeyUsd =
    template.provider === AIProviderName.ACTIVEPIECES ? 0 : weight * 3.1;
  const estimatedShare = template.estimatedShare ?? 0.08;
  return {
    id: template.id,
    name: template.name,
    subtitle: template.subtitle,
    provider: template.provider,
    calls,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    exactUsd: ownKeyUsd * (1 - estimatedShare),
    estimatedUsd: ownKeyUsd * estimatedShare,
    credits:
      template.provider === AIProviderName.ACTIVEPIECES ||
      template.provider === undefined
        ? Math.round(weight * 2100 * (template.creditShare ?? 0.35))
        : 0,
    unpricedCalls:
      template.unpricedCalls === undefined
        ? 0
        : Math.round(template.unpricedCalls * scale),
    monthlyLimitUsd: template.monthlyLimitUsd,
    monthToDateUsd:
      template.monthlyLimitUsd === undefined
        ? undefined
        : template.monthlyLimitUsd * (template.limitUsed ?? 0.4),
    dashboardUrl: template.dashboardUrl,
  };
}

function pointFrom({
  label,
  scale,
  random,
}: {
  label: string;
  scale: number;
  random: () => number;
}): UsagePoint {
  const wave = 0.6 + random() * 0.8;
  const base = scale * 38 * wave;
  return {
    label,
    exactUsd: base * 0.78,
    estimatedUsd: base * 0.07,
    creditsUsd: base * 0.15,
  };
}

function totalsOf({ rows }: { rows: UsageRow[] }): UsageTotals {
  const sum = (pick: (row: UsageRow) => number): number =>
    rows.reduce((total, row) => total + pick(row), 0);
  return {
    calls: sum((row) => row.calls),
    inputTokens: sum((row) => row.inputTokens),
    outputTokens: sum((row) => row.outputTokens),
    cacheReadTokens: sum((row) => row.cacheReadTokens),
    exactUsd: sum((row) => row.exactUsd),
    estimatedUsd: sum((row) => row.estimatedUsd),
    credits: sum((row) => row.credits),
    unpricedCalls: sum((row) => row.unpricedCalls),
  };
}

function spendUsdOf({ row }: { row: UsageRow }): number {
  return row.exactUsd + row.estimatedUsd + row.credits * CREDIT_USD_VALUE;
}

function pointLabels({ period }: { period: UsagePeriod }): string[] {
  const now = new Date('2026-10-20T10:23:00Z');
  const { count, stepMinutes } = PERIOD_STEPS[period];
  return Array.from({ length: count }, (_, index) => {
    const at = new Date(
      now.getTime() - (count - 1 - index) * stepMinutes * 60_000,
    );
    return stepMinutes >= DAY_MINUTES
      ? at.toISOString().slice(0, 10)
      : at.toISOString();
  });
}

function seededRandom({ seed }: { seed: string }): () => number {
  let state = [...seed].reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    7,
  );
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const CREDIT_USD_VALUE = 0.0005;
const DAY_MINUTES = 24 * 60;

const PERIOD_SCALE: Record<UsagePeriod, number> = {
  '1h': 0.02,
  '6h': 0.11,
  '12h': 0.22,
  '24h': 0.45,
  '7d': 3.1,
  '30d': 13,
  '90d': 37,
  'this-month': 8.6,
  'last-month': 12.4,
};

const PERIOD_STEPS: Record<
  UsagePeriod,
  { count: number; stepMinutes: number }
> = {
  '1h': { count: 12, stepMinutes: 5 },
  '6h': { count: 24, stepMinutes: 15 },
  '12h': { count: 24, stepMinutes: 30 },
  '24h': { count: 24, stepMinutes: 60 },
  '7d': { count: 7, stepMinutes: DAY_MINUTES },
  '30d': { count: 30, stepMinutes: DAY_MINUTES },
  '90d': { count: 90, stepMinutes: DAY_MINUTES },
  'this-month': { count: 20, stepMinutes: DAY_MINUTES },
  'last-month': { count: 30, stepMinutes: DAY_MINUTES },
};

const ROWS_BY_GROUP: Record<UsageGroupBy, RowTemplate[]> = {
  project: [
    {
      id: 'p1',
      name: 'Sales ops',
      weight: 9,
      monthlyLimitUsd: 50,
      limitUsed: 0.86,
    },
    {
      id: 'p2',
      name: 'Support desk',
      weight: 7,
      monthlyLimitUsd: 200,
      limitUsed: 0.31,
    },
    { id: 'p3', name: 'Marketing', weight: 4 },
    {
      id: 'p4',
      name: 'Finance',
      weight: 2.5,
      monthlyLimitUsd: 20,
      limitUsed: 1.04,
    },
    { id: 'p5', name: 'Data team', weight: 1.6 },
    { id: 'p6', name: 'Internal tools', weight: 0.4 },
  ],
  flow: [
    { id: 'f1', name: 'Lead enrichment', subtitle: 'Sales ops', weight: 6 },
    { id: 'f2', name: 'Ticket triage', subtitle: 'Support desk', weight: 5 },
    { id: 'f3', name: 'Invoice extraction', subtitle: 'Finance', weight: 2.4 },
    { id: 'f4', name: 'Weekly digest', subtitle: 'Marketing', weight: 1.8 },
    { id: 'f5', name: 'CRM sync', subtitle: 'Sales ops', weight: 1.1 },
    { id: 'f6', name: 'Contract review', subtitle: 'Finance', weight: 0.7 },
  ],
  agent: [
    { id: 'a1', name: 'Support agent', subtitle: 'Support desk', weight: 5.5 },
    { id: 'a2', name: 'Research agent', subtitle: 'Data team', weight: 3 },
    { id: 'a3', name: 'SDR agent', subtitle: 'Sales ops', weight: 2.2 },
    {
      id: 'a4',
      name: 'Onboarding helper',
      subtitle: 'Internal tools',
      weight: 0.6,
    },
  ],
  user: [
    { id: 'u1', name: 'Maya Chen', subtitle: 'maya@acme.com', weight: 3.2 },
    { id: 'u2', name: 'Omar Haddad', subtitle: 'omar@acme.com', weight: 2.6 },
    { id: 'u3', name: 'Lena Fischer', subtitle: 'lena@acme.com', weight: 1.9 },
    { id: 'u4', name: 'Sam Okafor', subtitle: 'sam@acme.com', weight: 1.2 },
    { id: 'u5', name: 'Priya Nair', subtitle: 'priya@acme.com', weight: 0.5 },
  ],
  key: [
    {
      id: 'k1',
      name: 'OpenAI · Production',
      provider: AIProviderName.OPENAI,
      weight: 8,
      estimatedShare: 0.04,
      dashboardUrl: 'https://platform.openai.com/usage',
    },
    {
      id: 'k2',
      name: 'Anthropic · Main',
      provider: AIProviderName.ANTHROPIC,
      weight: 6,
      estimatedShare: 0.06,
      dashboardUrl: 'https://console.anthropic.com/usage',
    },
    {
      id: 'k3',
      name: 'Azure · EU',
      provider: AIProviderName.AZURE,
      weight: 2.5,
      estimatedShare: 0.35,
      unpricedCalls: 1204,
      dashboardUrl:
        'https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.CognitiveServices%2Faccounts',
    },
    {
      id: 'k4',
      name: 'OpenRouter',
      provider: AIProviderName.OPENROUTER,
      weight: 1.8,
      estimatedShare: 0,
      dashboardUrl: 'https://openrouter.ai/activity',
    },
    {
      id: 'k5',
      name: 'Credits',
      provider: AIProviderName.ACTIVEPIECES,
      weight: 3,
      creditShare: 1,
      dashboardUrl: '/platform/usage',
    },
  ],
  model: [
    {
      id: 'm1',
      name: 'Claude Sonnet 5',
      subtitle: 'Anthropic',
      provider: AIProviderName.ANTHROPIC,
      weight: 6,
    },
    {
      id: 'm2',
      name: 'GPT-5',
      subtitle: 'OpenAI',
      provider: AIProviderName.OPENAI,
      weight: 5,
    },
    {
      id: 'm3',
      name: 'Gemini 3 Pro',
      subtitle: 'Google',
      provider: AIProviderName.GOOGLE,
      weight: 2.4,
    },
    {
      id: 'm4',
      name: 'GPT-5 mini',
      subtitle: 'OpenAI',
      provider: AIProviderName.OPENAI,
      weight: 1.6,
    },
    {
      id: 'm5',
      name: 'gpt-prod-eu',
      subtitle: 'Azure deployment',
      provider: AIProviderName.AZURE,
      weight: 1.1,
      estimatedShare: 1,
      unpricedCalls: 1204,
    },
  ],
  origin: [
    {
      id: 'o1',
      name: 'Flow steps',
      subtitle: 'Ask AI, Summarize, Classify, Extract, Router',
      weight: 7,
    },
    {
      id: 'o2',
      name: 'Chat',
      subtitle: 'Conversations in the chat',
      weight: 5,
    },
    {
      id: 'o3',
      name: 'Run Agent steps',
      subtitle: 'Agents called from flows',
      weight: 4,
    },
    {
      id: 'o4',
      name: 'Agents',
      subtitle: 'Agents run on their own',
      weight: 2.2,
    },
    {
      id: 'o5',
      name: 'Knowledge base',
      subtitle: 'Indexing and search',
      weight: 0.5,
    },
  ],
};

export const usageDummyData = {
  buildSummary,
  spendUsdOf,
};

export const USAGE_PERIODS: UsagePeriod[] = [
  '1h',
  '6h',
  '12h',
  '24h',
  '7d',
  '30d',
  '90d',
  'this-month',
  'last-month',
];
export const USAGE_GROUPS: UsageGroupBy[] = [
  'project',
  'flow',
  'agent',
  'user',
  'key',
  'model',
  'origin',
];

export type UsagePeriod =
  | '1h'
  | '6h'
  | '12h'
  | '24h'
  | '7d'
  | '30d'
  | '90d'
  | 'this-month'
  | 'last-month';

export type UsageGroupBy =
  | 'project'
  | 'flow'
  | 'agent'
  | 'user'
  | 'key'
  | 'model'
  | 'origin';

export type UsageRow = {
  id: string;
  name: string;
  subtitle?: string;
  provider?: AIProviderName;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  exactUsd: number;
  estimatedUsd: number;
  credits: number;
  unpricedCalls: number;
  monthlyLimitUsd?: number;
  monthToDateUsd?: number;
  dashboardUrl?: string;
};

export type UsagePoint = {
  label: string;
  exactUsd: number;
  estimatedUsd: number;
  creditsUsd: number;
};

export type UsageTotals = Omit<
  UsageRow,
  | 'id'
  | 'name'
  | 'subtitle'
  | 'provider'
  | 'monthlyLimitUsd'
  | 'monthToDateUsd'
  | 'dashboardUrl'
>;

export type UsageSummary = {
  totals: UsageTotals;
  points: UsagePoint[];
  rows: UsageRow[];
  dataThroughMinutesAgo: number;
  trackingSince: string;
  creditUsdValue: number;
};

type RowTemplate = {
  id: string;
  name: string;
  subtitle?: string;
  provider?: AIProviderName;
  weight: number;
  estimatedShare?: number;
  creditShare?: number;
  unpricedCalls?: number;
  monthlyLimitUsd?: number;
  limitUsed?: number;
  dashboardUrl?: string;
};

type BuildSummaryParams = {
  period: UsagePeriod;
  groupBy: UsageGroupBy;
  includeTestRuns: boolean;
};
