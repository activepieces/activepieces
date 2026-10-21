import { AIProviderName } from '@activepieces/core-utils';

function buildOverview({ period, scope, preset }: ViewParams): UsageOverview {
  const random = seededRandom({
    seed: `overview:${period}:${scope}:${preset}`,
  });
  const profile = PRESET_PROFILES[preset];
  const items = allItems({ period, scope, preset, random });
  const projects = itemsOf({ items, dimension: 'project' });
  const spendUsd = sumOf({ items: projects, pick: (item) => item.spendUsd });
  const previousSpendUsd = sumOf({
    items: projects,
    pick: (item) => item.previousSpendUsd,
  });
  const calls = sumOf({ items: projects, pick: (item) => item.calls });
  const tokens = sumOf({ items: projects, pick: (item) => item.tokens });
  const history = historyFor({ period, preset });
  return {
    history,
    totals: {
      spendUsd,
      previousSpendUsd,
      calls,
      tokens,
      cacheShare: 0.37,
      credits: Math.round((spendUsd * profile.creditShare) / CREDIT_USD_VALUE),
    },
    series: seriesFor({
      period,
      preset,
      spendUsd,
      previousSpendUsd,
      calls,
      tokens,
      random,
    }),
    forecastUsd:
      period === 'this-month'
        ? (spendUsd / Math.min(MONTH_DAYS_SO_FAR, history.coveredDays)) *
          MONTH_DAYS
        : undefined,
    avgPerDayUsd:
      spendUsd /
      Math.max(
        Math.min(PERIOD_DAYS[period], history.coveredDays),
        PERIOD_DAYS['1h'],
      ),
    bySource: sourcesFor({ preset, spendUsd }),
    top: topByDimension({ items }),
    limits: projects
      .filter(
        (item) =>
          item.monthlyLimitUsd !== undefined &&
          (item.monthToDateUsd ?? 0) / item.monthlyLimitUsd >= LIMIT_WARN_SHARE,
      )
      .sort(
        (a, b) =>
          (b.monthToDateUsd ?? 0) / (b.monthlyLimitUsd ?? 1) -
          (a.monthToDateUsd ?? 0) / (a.monthlyLimitUsd ?? 1),
      ),
  };
}

function buildDetail({
  period,
  scope,
  preset,
  dimension,
  id,
}: ViewParams & { dimension: UsageDimension; id: string }):
  | UsageDetail
  | undefined {
  const random = seededRandom({
    seed: `detail:${period}:${scope}:${dimension}:${id}`,
  });
  const items = allItems({ period, scope, preset, random });
  const item = items.find(
    (candidate) => candidate.dimension === dimension && candidate.id === id,
  );
  if (item === undefined) {
    return undefined;
  }
  const share =
    item.spendUsd /
    sumOf({
      items: itemsOf({ items, dimension }),
      pick: (candidate) => candidate.spendUsd,
    });
  const related = Object.fromEntries(
    RELATED_DIMENSIONS[dimension].map((other) => [
      other,
      itemsOf({ items, dimension: other })
        .slice(0, TOP_COUNT)
        .map((candidate) => ({
          ...candidate,
          spendUsd: candidate.spendUsd * share * (0.6 + random() * 0.8),
          previousSpendUsd:
            candidate.previousSpendUsd * share * (0.6 + random() * 0.8),
        }))
        .sort((a, b) => b.spendUsd - a.spendUsd),
    ]),
  );
  return {
    item,
    history: historyFor({ period, preset }),
    series: seriesFor({
      period,
      preset,
      spendUsd: item.spendUsd,
      previousSpendUsd: item.previousSpendUsd,
      calls: item.calls,
      tokens: item.tokens,
      random,
    }),
    related,
    bySource:
      dimension === 'project' || dimension === 'agent'
        ? sourcesFor({ preset, spendUsd: item.spendUsd })
        : undefined,
    runs: dimension === 'flow' ? Math.round(item.calls / 2.4) : undefined,
    reportedUsd:
      dimension === 'key'
        ? item.spendUsd * (1 - (item.estimatedShare ?? 0))
        : undefined,
    estimatedUsd:
      dimension === 'key'
        ? item.spendUsd * (item.estimatedShare ?? 0)
        : undefined,
  };
}

function buildList({
  period,
  scope,
  preset,
  dimension,
}: ViewParams & { dimension: UsageDimension }): UsageItem[] {
  const random = seededRandom({
    seed: `list:${period}:${scope}:${preset}:${dimension}`,
  });
  return itemsOf({
    items: allItems({ period, scope, preset, random }),
    dimension,
  });
}

function allItems({
  period,
  scope,
  preset,
  random,
}: ViewParams & { random: () => number }): UsageItem[] {
  const profile = PRESET_PROFILES[preset];
  const history = historyFor({ period, preset });
  const scale =
    PERIOD_SCALE[period] *
    history.currentCoverage *
    profile.scale *
    SCOPE_FACTOR[scope]({ testingShare: profile.testingShare });
  return CATALOG.filter(
    (entry) => profile.members === 'all' || profile.members.includes(entry.id),
  )
    .map((entry) => {
      const spendUsd = entry.weight * scale * (0.9 + random() * 0.2);
      const change = entry.change ?? random() * 0.6 - 0.25;
      const calls = Math.round(
        spendUsd *
          (entry.dimension === 'model' && entry.name.includes('mini')
            ? 900
            : 140),
      );
      return {
        ...entry,
        spendUsd,
        previousSpendUsd: spendUsd / (1 + change),
        comparable: history.comparable,
        calls,
        tokens: Math.round(calls * (2100 + random() * 1800)),
        credits:
          entry.provider === AIProviderName.ACTIVEPIECES
            ? Math.round(spendUsd / CREDIT_USD_VALUE)
            : 0,
        flowCount: childCount({ entry, dimension: 'flow' }),
        agentCount: childCount({ entry, dimension: 'agent' }),
        monthToDateUsd:
          entry.monthlyLimitUsd === undefined
            ? undefined
            : entry.monthlyLimitUsd * (entry.limitUsed ?? 0.4),
      };
    })
    .sort((a, b) => b.spendUsd - a.spendUsd);
}

function childCount({
  entry,
  dimension,
}: {
  entry: CatalogEntry;
  dimension: UsageDimension;
}): number | undefined {
  return entry.dimension === 'project'
    ? CATALOG.filter(
        (child) => child.dimension === dimension && child.parent === entry.name,
      ).length
    : undefined;
}

function sourcesFor({
  preset,
  spendUsd,
}: {
  preset: UsageDataPreset;
  spendUsd: number;
}): UsageSourceSpend[] {
  const kept = SOURCES.filter((source) =>
    PRESET_PROFILES[preset].sources.includes(source.source),
  );
  const total = kept.reduce((sum, source) => sum + source.share, 0);
  return kept.map((source) => ({
    source: source.source,
    spendUsd: total === 0 ? 0 : (spendUsd * source.share) / total,
  }));
}

function topByDimension({
  items,
}: {
  items: UsageItem[];
}): Record<UsageDimension, UsageItem[]> {
  return {
    project: itemsOf({ items, dimension: 'project' }).slice(0, TOP_COUNT),
    flow: itemsOf({ items, dimension: 'flow' }).slice(0, TOP_COUNT),
    agent: itemsOf({ items, dimension: 'agent' }).slice(0, TOP_COUNT),
    user: itemsOf({ items, dimension: 'user' }).slice(0, TOP_COUNT),
    key: itemsOf({ items, dimension: 'key' }).slice(0, TOP_COUNT),
    model: itemsOf({ items, dimension: 'model' }).slice(0, TOP_COUNT),
  };
}

function itemsOf({
  items,
  dimension,
}: {
  items: UsageItem[];
  dimension: UsageDimension;
}): UsageItem[] {
  return items.filter((item) => item.dimension === dimension);
}

function sumOf({
  items,
  pick,
}: {
  items: UsageItem[];
  pick: (item: UsageItem) => number;
}): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

function historyFor({
  period,
  preset,
}: {
  period: UsagePeriod;
  preset: UsageDataPreset;
}): UsageHistory {
  const { trackedDays } = PRESET_PROFILES[preset];
  const labels = pointLabels({ period });
  const now = NOW.getTime();
  const periodDays = PERIOD_DAYS[period];
  if (trackedDays === undefined) {
    return {
      trackingSince: TRACKING_SINCE,
      coveredDays: periodDays,
      periodDays,
      currentCoverage: 1,
      comparable: true,
    };
  }
  const cutoff = now - trackedDays * DAY_MS;
  const start = timeOf({ label: labels[0] });
  const previousStart = previousTimeOf({
    period,
    time: start,
    count: labels.length,
    labels,
  });
  const coveredDays = Math.min(periodDays, trackedDays);
  return {
    trackingSince: new Date(cutoff).toISOString().slice(0, 10),
    coveredDays,
    periodDays,
    currentCoverage: start >= cutoff ? 1 : coveredDays / periodDays,
    comparable: previousStart >= cutoff,
  };
}

function previousTimeOf({
  period,
  time,
  count,
  labels,
}: {
  period: UsagePeriod;
  time: number;
  count: number;
  labels: string[];
}): number {
  if (period === 'this-month' || period === 'last-month') {
    const date = new Date(time);
    date.setUTCMonth(date.getUTCMonth() - 1);
    return date.getTime();
  }
  const step =
    labels.length > 1
      ? timeOf({ label: labels[1] }) - timeOf({ label: labels[0] })
      : DAY_MS;
  return time - step * count;
}

function timeOf({ label }: { label: string }): number {
  return label.includes('T')
    ? new Date(label).getTime()
    : new Date(`${label}T00:00:00Z`).getTime();
}

function seriesFor({
  period,
  preset,
  spendUsd,
  previousSpendUsd,
  calls,
  tokens,
  random,
}: SeriesParams): Record<UsageMetric, UsagePoint[]> {
  const labels = pointLabels({ period });
  const shape = labels.map(
    (_, index) => 0.7 + 0.3 * Math.sin(index / 2.3) + random() * 0.35,
  );
  const previousShape = labels.map(
    (_, index) => 0.75 + 0.25 * Math.cos(index / 2.9) + random() * 0.3,
  );
  const total = shape.reduce((sum, value) => sum + value, 0);
  const previousTotal = previousShape.reduce((sum, value) => sum + value, 0);
  const { trackedDays } = PRESET_PROFILES[preset];
  const cutoff =
    trackedDays === undefined
      ? undefined
      : NOW.getTime() - trackedDays * DAY_MS;
  const tracked = (time: number): boolean =>
    cutoff === undefined || time >= cutoff;
  const pointsFor = (current: number, previous: number): UsagePoint[] =>
    labels.map((label, index) => {
      const time = timeOf({ label });
      const previousTime = previousTimeOf({
        period,
        time,
        count: labels.length,
        labels,
      });
      return {
        label,
        current: tracked(time) ? (current * shape[index]) / total : null,
        previous: tracked(previousTime)
          ? (previous * previousShape[index]) / previousTotal
          : null,
      };
    });
  const ratio = previousSpendUsd / Math.max(spendUsd, 0.0001);
  return {
    spend: pointsFor(spendUsd, previousSpendUsd),
    calls: pointsFor(calls, calls * ratio),
    tokens: pointsFor(tokens, tokens * ratio),
  };
}

function pointLabels({ period }: { period: UsagePeriod }): string[] {
  const now = NOW;
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
const NOW = new Date('2026-10-20T10:20:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const TRACKING_SINCE = '2025-09-01';
const LIMIT_WARN_SHARE = 0.8;
const TOP_COUNT = 5;
const DAY_MINUTES = 24 * 60;
const MONTH_DAYS = 31;
const MONTH_DAYS_SO_FAR = 20;

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

const PERIOD_DAYS: Record<UsagePeriod, number> = {
  '1h': 1 / 24,
  '6h': 0.25,
  '12h': 0.5,
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'this-month': MONTH_DAYS_SO_FAR,
  'last-month': 30,
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
  'this-month': { count: MONTH_DAYS_SO_FAR, stepMinutes: DAY_MINUTES },
  'last-month': { count: 30, stepMinutes: DAY_MINUTES },
};

const SOURCES: { source: UsageSource; share: number }[] = [
  { source: 'flow-steps', share: 0.41 },
  { source: 'chat', share: 0.27 },
  { source: 'agent-steps', share: 0.19 },
  { source: 'agents', share: 0.1 },
  { source: 'knowledge-base', share: 0.03 },
];

const SCOPE_FACTOR: Record<
  UsageScope,
  (params: { testingShare: number }) => number
> = {
  production: () => 1,
  testing: ({ testingShare }) => testingShare,
  all: ({ testingShare }) => 1 + testingShare,
};

const ALL_SOURCES: UsageSource[] = [
  'flow-steps',
  'chat',
  'agent-steps',
  'agents',
  'knowledge-base',
];

const PRESET_PROFILES: Record<UsageDataPreset, PresetProfile> = {
  empty: {
    members: [],
    scale: 0,
    testingShare: 0,
    creditShare: 0,
    sources: [],
  },
  minimal: {
    members: [
      'sales-ops',
      'lead-enrichment',
      'crm-sync',
      'maya',
      'openai-prod',
      'gpt-5',
      'gpt-5-mini',
    ],
    scale: 0.12,
    testingShare: 0.03,
    creditShare: 0,
    sources: ['flow-steps', 'chat'],
  },
  half: {
    members: [
      'sales-ops',
      'support-desk',
      'finance',
      'lead-enrichment',
      'ticket-triage',
      'invoice-extraction',
      'crm-sync',
      'support-agent',
      'sdr-agent',
      'maya',
      'omar',
      'lena',
      'openai-prod',
      'anthropic-main',
      'credits',
      'claude-sonnet-5',
      'gpt-5',
      'gpt-5-mini',
    ],
    scale: 0.55,
    testingShare: 0.06,
    creditShare: 0.08,
    sources: ['flow-steps', 'chat', 'agent-steps', 'agents'],
  },
  'short-history': {
    members: 'all',
    scale: 1,
    testingShare: 0.09,
    creditShare: 0.12,
    sources: ALL_SOURCES,
    trackedDays: 25,
  },
  'partial-history': {
    members: 'all',
    scale: 1,
    testingShare: 0.09,
    creditShare: 0.12,
    sources: ALL_SOURCES,
    trackedDays: 45,
  },
  rich: {
    members: 'all',
    scale: 1,
    testingShare: 0.09,
    creditShare: 0.12,
    sources: ALL_SOURCES,
  },
};

const RELATED_DIMENSIONS: Record<UsageDimension, UsageDimension[]> = {
  project: ['flow', 'agent', 'user', 'model', 'key'],
  flow: ['model', 'key'],
  agent: ['user', 'model', 'key'],
  user: ['agent', 'project', 'model'],
  key: ['project', 'flow', 'model'],
  model: ['project', 'flow', 'agent', 'key'],
};

const CATALOG: CatalogEntry[] = [
  {
    dimension: 'project',
    id: 'sales-ops',
    name: 'Sales ops',
    weight: 9,
    change: 0.22,
    monthlyLimitUsd: 120,
    limitUsed: 0.86,
  },
  {
    dimension: 'project',
    id: 'support-desk',
    name: 'Support desk',
    weight: 7,
    change: 0.08,
    monthlyLimitUsd: 300,
    limitUsed: 0.31,
  },
  {
    dimension: 'project',
    id: 'marketing',
    name: 'Marketing',
    weight: 4,
    change: -0.12,
  },
  {
    dimension: 'project',
    id: 'finance',
    name: 'Finance',
    weight: 2.5,
    change: 0.41,
    monthlyLimitUsd: 60,
    limitUsed: 0.97,
  },
  {
    dimension: 'project',
    id: 'data-team',
    name: 'Data team',
    weight: 1.6,
    change: -0.05,
  },
  {
    dimension: 'project',
    id: 'internal-tools',
    name: 'Internal tools',
    weight: 0.4,
    change: 0.02,
  },
  {
    dimension: 'flow',
    id: 'lead-enrichment',
    sharedWith: 'SDR agent',
    sharedShare: 0.3,
    name: 'Lead enrichment',
    parent: 'Sales ops',
    weight: 6,
    change: 0.35,
  },
  {
    dimension: 'flow',
    id: 'ticket-triage',
    sharedWith: 'Support agent',
    sharedShare: 0.45,
    name: 'Ticket triage',
    parent: 'Support desk',
    weight: 5,
    change: 2.4,
  },
  {
    dimension: 'flow',
    id: 'invoice-extraction',
    name: 'Invoice extraction',
    parent: 'Finance',
    weight: 2.4,
    change: 0.6,
  },
  {
    dimension: 'flow',
    id: 'weekly-digest',
    name: 'Weekly digest',
    parent: 'Marketing',
    weight: 1.8,
    change: -0.2,
  },
  {
    dimension: 'flow',
    id: 'crm-sync',
    name: 'CRM sync',
    parent: 'Sales ops',
    weight: 1.1,
    change: 0.04,
  },
  {
    dimension: 'flow',
    id: 'contract-review',
    name: 'Contract review',
    parent: 'Finance',
    weight: 0.7,
    change: -0.1,
  },
  {
    dimension: 'flow',
    id: 'social-listening',
    name: 'Social listening',
    parent: 'Marketing',
    weight: 0.5,
    change: 0.12,
  },
  {
    dimension: 'agent',
    id: 'support-agent',
    sharedWith: 'Ticket triage',
    sharedShare: 0.4,
    name: 'Support agent',
    parent: 'Support desk',
    weight: 5.5,
    change: 0.18,
  },
  {
    dimension: 'agent',
    id: 'research-agent',
    name: 'Research agent',
    parent: 'Data team',
    weight: 3,
    change: 0.9,
  },
  {
    dimension: 'agent',
    id: 'sdr-agent',
    sharedWith: 'Lead enrichment',
    sharedShare: 0.55,
    name: 'SDR agent',
    parent: 'Sales ops',
    weight: 2.2,
    change: -0.15,
  },
  {
    dimension: 'agent',
    id: 'onboarding-helper',
    name: 'Onboarding helper',
    parent: 'Internal tools',
    weight: 0.6,
    change: 0.03,
  },
  {
    dimension: 'user',
    id: 'maya',
    name: 'Maya Chen',
    parent: 'maya@acme.com',
    weight: 3.2,
    change: 0.12,
  },
  {
    dimension: 'user',
    id: 'omar',
    name: 'Omar Haddad',
    parent: 'omar@acme.com',
    weight: 2.6,
    change: 0.44,
  },
  {
    dimension: 'user',
    id: 'lena',
    name: 'Lena Fischer',
    parent: 'lena@acme.com',
    weight: 1.9,
    change: -0.08,
  },
  {
    dimension: 'user',
    id: 'sam',
    name: 'Sam Okafor',
    parent: 'sam@acme.com',
    weight: 1.2,
    change: 0.05,
  },
  {
    dimension: 'user',
    id: 'priya',
    name: 'Priya Nair',
    parent: 'priya@acme.com',
    weight: 0.5,
    change: -0.3,
  },
  {
    dimension: 'user',
    id: 'jonas',
    name: 'Jonas Berg',
    parent: 'jonas@acme.com',
    weight: 0.3,
    change: 0.2,
  },
  {
    dimension: 'key',
    id: 'openai-prod',
    name: 'Production',
    parent: 'OpenAI',
    provider: AIProviderName.OPENAI,
    weight: 8,
    change: 0.15,
    estimatedShare: 0.04,
    dashboardUrl: 'https://platform.openai.com/usage',
  },
  {
    dimension: 'key',
    id: 'anthropic-main',
    name: 'Main',
    parent: 'Anthropic',
    provider: AIProviderName.ANTHROPIC,
    weight: 6,
    change: 0.28,
    estimatedShare: 0.06,
    dashboardUrl: 'https://console.anthropic.com/usage',
  },
  {
    dimension: 'key',
    id: 'credits',
    name: 'Activepieces credits',
    provider: AIProviderName.ACTIVEPIECES,
    weight: 3,
    change: 0.1,
    estimatedShare: 0,
    dashboardUrl: '/platform/usage',
  },
  {
    dimension: 'key',
    id: 'azure-eu',
    name: 'EU',
    parent: 'Azure OpenAI',
    provider: AIProviderName.AZURE,
    weight: 2.5,
    change: -0.04,
    estimatedShare: 0.35,
    dashboardUrl: 'https://portal.azure.com',
  },
  {
    dimension: 'key',
    id: 'openrouter',
    name: 'Team key',
    parent: 'OpenRouter',
    provider: AIProviderName.OPENROUTER,
    weight: 1.8,
    change: 0.5,
    estimatedShare: 0,
    dashboardUrl: 'https://openrouter.ai/activity',
  },
  {
    dimension: 'model',
    id: 'claude-sonnet-5',
    keyId: 'anthropic-main',
    name: 'Claude Sonnet 5',
    parent: 'Anthropic',
    provider: AIProviderName.ANTHROPIC,
    weight: 6,
    change: 0.3,
    inputPrice: 3,
    outputPrice: 15,
  },
  {
    dimension: 'model',
    id: 'gpt-5',
    keyId: 'openai-prod',
    name: 'GPT-5',
    parent: 'OpenAI',
    provider: AIProviderName.OPENAI,
    weight: 5,
    change: 0.1,
    inputPrice: 1.25,
    outputPrice: 10,
  },
  {
    dimension: 'model',
    id: 'gemini-3-pro',
    keyId: 'openrouter',
    name: 'Gemini 3 Pro',
    parent: 'Google',
    provider: AIProviderName.GOOGLE,
    weight: 2.4,
    change: 0.65,
    inputPrice: 2,
    outputPrice: 12,
  },
  {
    dimension: 'model',
    id: 'gpt-5-mini',
    keyId: 'openai-prod',
    name: 'GPT-5 mini',
    parent: 'OpenAI',
    provider: AIProviderName.OPENAI,
    weight: 1.6,
    change: -0.1,
    inputPrice: 0.25,
    outputPrice: 2,
  },
  {
    dimension: 'model',
    id: 'claude-haiku-4-5',
    keyId: 'anthropic-main',
    name: 'Claude Haiku 4.5',
    parent: 'Anthropic',
    provider: AIProviderName.ANTHROPIC,
    weight: 1.2,
    change: 0.02,
    inputPrice: 1,
    outputPrice: 5,
  },
  {
    dimension: 'model',
    id: 'gpt-prod-eu',
    keyId: 'azure-eu',
    name: 'gpt-prod-eu',
    parent: 'Azure deployment',
    provider: AIProviderName.AZURE,
    weight: 1.1,
    change: -0.04,
  },
];

export const usageDummyData = {
  buildOverview,
  buildDetail,
  buildList,
};

export const USAGE_PRESETS: UsagePreset[] = [
  'loading',
  'error',
  'empty',
  'minimal',
  'half',
  'short-history',
  'partial-history',
  'rich',
];
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
export const USAGE_DIMENSIONS: UsageDimension[] = [
  'project',
  'flow',
  'agent',
  'user',
  'key',
  'model',
];
export const USAGE_SCOPES: UsageScope[] = ['all', 'production', 'testing'];
export const USAGE_METRICS: UsageMetric[] = ['spend', 'calls', 'tokens'];

export type UsagePreset = 'loading' | 'error' | UsageDataPreset;
export type UsageDataPreset =
  | 'empty'
  | 'minimal'
  | 'half'
  | 'short-history'
  | 'partial-history'
  | 'rich';

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
export type UsageDimension =
  | 'project'
  | 'flow'
  | 'agent'
  | 'user'
  | 'key'
  | 'model';
export type UsageScope = 'production' | 'testing' | 'all';
export type UsageMetric = 'spend' | 'calls' | 'tokens';
export type UsageSource =
  | 'flow-steps'
  | 'agent-steps'
  | 'agents'
  | 'chat'
  | 'knowledge-base';

export type UsageItem = CatalogEntry & {
  spendUsd: number;
  previousSpendUsd: number;
  comparable: boolean;
  calls: number;
  tokens: number;
  credits: number;
  flowCount?: number;
  agentCount?: number;
  monthToDateUsd?: number;
};

export type UsagePoint = {
  label: string;
  current: number | null;
  previous: number | null;
};

export type UsageHistory = {
  trackingSince: string;
  coveredDays: number;
  periodDays: number;
  currentCoverage: number;
  comparable: boolean;
};

export type UsageSourceSpend = {
  source: UsageSource;
  spendUsd: number;
};

export type UsageOverview = {
  history: UsageHistory;
  totals: {
    spendUsd: number;
    previousSpendUsd: number;
    calls: number;
    tokens: number;
    cacheShare: number;
    credits: number;
  };
  series: Record<UsageMetric, UsagePoint[]>;
  forecastUsd?: number;
  avgPerDayUsd: number;
  bySource: UsageSourceSpend[];
  top: Record<UsageDimension, UsageItem[]>;
  limits: UsageItem[];
};

export type UsageDetail = {
  item: UsageItem;
  history: UsageHistory;
  series: Record<UsageMetric, UsagePoint[]>;
  related: Partial<Record<UsageDimension, UsageItem[]>>;
  bySource?: UsageSourceSpend[];
  runs?: number;
  reportedUsd?: number;
  estimatedUsd?: number;
};

type CatalogEntry = {
  dimension: UsageDimension;
  id: string;
  name: string;
  parent?: string;
  provider?: AIProviderName;
  weight: number;
  change?: number;
  estimatedShare?: number;
  dashboardUrl?: string;
  monthlyLimitUsd?: number;
  limitUsed?: number;
  inputPrice?: number;
  outputPrice?: number;
  keyId?: string;
  sharedWith?: string;
  sharedShare?: number;
};

type ViewParams = {
  period: UsagePeriod;
  scope: UsageScope;
  preset: UsageDataPreset;
};

type PresetProfile = {
  members: string[] | 'all';
  scale: number;
  testingShare: number;
  creditShare: number;
  sources: UsageSource[];
  trackedDays?: number;
};

type SeriesParams = {
  period: UsagePeriod;
  preset: UsageDataPreset;
  spendUsd: number;
  previousSpendUsd: number;
  calls: number;
  tokens: number;
  random: () => number;
};
