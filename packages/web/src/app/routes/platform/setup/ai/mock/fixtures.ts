import { AIProviderName } from '@activepieces/core-utils';

export const MODEL_CATALOG: ModelFacts[] = [
  model({
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: AIProviderName.OPENAI,
    contextWindow: 400_000,
    cost: { input: 1.75, output: 14 },
    speed: 'medium',
    vision: true,
    imageGeneration: true,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/openai/gpt-5.2',
  }),
  model({
    id: 'gpt-5.2-mini',
    name: 'GPT-5.2 Mini',
    provider: AIProviderName.OPENAI,
    contextWindow: 400_000,
    cost: { input: 0.25, output: 2 },
    speed: 'fast',
    vision: true,
    imageGeneration: true,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/openai/gpt-5.2-mini',
  }),
  model({
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: AIProviderName.OPENAI,
    contextWindow: 400_000,
    cost: { input: 21, output: 168 },
    speed: 'slow',
    vision: true,
    imageGeneration: true,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/openai/gpt-5.2-pro',
  }),
  model({
    id: 'text-embedding-4-large',
    name: 'Text Embedding 4 Large',
    provider: AIProviderName.OPENAI,
    contextWindow: 8_191,
    cost: { input: 0.13, output: 0 },
    speed: 'fast',
    vision: false,
    imageGeneration: false,
    embeddings: true,
    detailsUrl: 'https://openrouter.ai/openai/text-embedding-4-large',
  }),
  model({
    id: 'claude-opus-4.8',
    name: 'Claude Opus 4.8',
    provider: AIProviderName.ANTHROPIC,
    contextWindow: 500_000,
    cost: { input: 12, output: 60 },
    speed: 'slow',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-opus-4.8',
  }),
  model({
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: AIProviderName.ANTHROPIC,
    contextWindow: 300_000,
    cost: { input: 3, output: 15 },
    speed: 'medium',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-sonnet-4.6',
  }),
  model({
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: AIProviderName.ANTHROPIC,
    contextWindow: 200_000,
    cost: { input: 0.8, output: 4 },
    speed: 'fast',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-haiku-4.5',
  }),
  model({
    id: 'gemini-3.0-pro',
    name: 'Gemini 3.0 Pro',
    provider: AIProviderName.GOOGLE,
    contextWindow: 2_000_000,
    cost: { input: 2.5, output: 15 },
    speed: 'medium',
    vision: true,
    imageGeneration: true,
    embeddings: true,
    detailsUrl: 'https://openrouter.ai/google/gemini-3.0-pro',
  }),
  model({
    id: 'gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: AIProviderName.GOOGLE,
    contextWindow: 1_000_000,
    cost: { input: 0.15, output: 0.6 },
    speed: 'fast',
    vision: true,
    imageGeneration: true,
    embeddings: true,
    detailsUrl: 'https://openrouter.ai/google/gemini-3.0-flash',
  }),
  model({
    id: 'anthropic/claude-opus-4.8',
    name: 'Claude Opus 4.8 (OpenRouter)',
    provider: AIProviderName.OPENROUTER,
    contextWindow: 500_000,
    cost: { input: 12, output: 60 },
    speed: 'slow',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-opus-4.8',
  }),
  model({
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6 (OpenRouter)',
    provider: AIProviderName.OPENROUTER,
    contextWindow: 300_000,
    cost: { input: 3, output: 15 },
    speed: 'medium',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-sonnet-4.6',
  }),
  model({
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5 (OpenRouter)',
    provider: AIProviderName.OPENROUTER,
    contextWindow: 200_000,
    cost: { input: 0.8, output: 4 },
    speed: 'fast',
    vision: true,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/anthropic/claude-haiku-4.5',
  }),
  model({
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2 (OpenRouter)',
    provider: AIProviderName.OPENROUTER,
    contextWindow: 400_000,
    cost: { input: 1.75, output: 14 },
    speed: 'medium',
    vision: true,
    imageGeneration: true,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/openai/gpt-5.2',
  }),
  model({
    id: 'deepseek/deepseek-v4',
    name: 'DeepSeek V4 (OpenRouter)',
    provider: AIProviderName.OPENROUTER,
    contextWindow: 256_000,
    cost: { input: 0.27, output: 1.1 },
    speed: 'fast',
    vision: false,
    imageGeneration: false,
    embeddings: false,
    detailsUrl: 'https://openrouter.ai/deepseek/deepseek-v4',
  }),
  model({
    id: 'mistral-large-3',
    name: 'Mistral Large 3',
    provider: AIProviderName.MISTRAL,
    contextWindow: 256_000,
    cost: { input: 2, output: 6 },
    speed: 'medium',
    vision: true,
    imageGeneration: false,
    embeddings: true,
    detailsUrl: 'https://openrouter.ai/mistralai/mistral-large-3',
  }),
];

export const MOCK_SCENARIO_IDS = [
  'configured',
  'defaults',
  'empty',
  'provider-down',
  'limit-reached',
] as const;

export const DEFAULT_SCENARIO_ID: MockScenarioId = 'configured';

export const SCENARIOS: Record<MockScenarioId, MockScenario> = {
  configured: {
    id: 'configured',
    label: 'Configured',
    providers: [
      providerStatus({ provider: AIProviderName.OPENAI }),
      providerStatus({ provider: AIProviderName.ANTHROPIC }),
      providerStatus({ provider: AIProviderName.GOOGLE }),
      providerStatus({ provider: AIProviderName.OPENROUTER }),
    ],
    chatProvider: AIProviderName.ANTHROPIC,
    routing: {
      isDefault: false,
      tiers: [
        ...builtInTiers(),
        {
          id: 'custom-legal',
          name: 'Legal drafting',
          description: 'Long-context contract work',
          builtIn: false,
          slots: {
            main: { provider: AIProviderName.GOOGLE, modelId: 'gemini-3.0-pro' },
            backup1: {
              provider: AIProviderName.OPENAI,
              modelId: 'gpt-5.2',
            },
            backup2: {
              provider: AIProviderName.OPENROUTER,
              modelId: 'openai/gpt-5.2',
            },
          },
        },
      ],
    },
    usage: standardUsage(),
    currentProject: { name: 'Marketing Ops', creditsUsed: 3_240, limit: 10_000 },
  },
  defaults: {
    id: 'defaults',
    label: 'Fresh defaults',
    providers: [providerStatus({ provider: AIProviderName.ANTHROPIC })],
    chatProvider: AIProviderName.ANTHROPIC,
    routing: {
      isDefault: true,
      tiers: builtInTiers({ singleProvider: AIProviderName.ANTHROPIC }),
    },
    usage: standardUsage().map((row) => ({ ...row, limit: null })),
    currentProject: { name: 'Marketing Ops', creditsUsed: 3_240, limit: null },
  },
  empty: {
    id: 'empty',
    label: 'Empty platform',
    providers: [],
    chatProvider: null,
    routing: { isDefault: true, tiers: [] },
    usage: [],
    currentProject: { name: 'Marketing Ops', creditsUsed: 0, limit: null },
  },
  'provider-down': {
    id: 'provider-down',
    label: 'Provider outage',
    providers: [
      providerStatus({ provider: AIProviderName.OPENAI, down: true }),
      providerStatus({ provider: AIProviderName.ANTHROPIC }),
      providerStatus({ provider: AIProviderName.GOOGLE }),
    ],
    chatProvider: AIProviderName.OPENAI,
    routing: {
      isDefault: false,
      tiers: builtInTiers().map((tier) => ({
        ...tier,
        slots: {
          ...tier.slots,
          backup2: { ...tier.slots.backup2, providerDeleted: true },
        },
      })),
    },
    usage: standardUsage(),
    currentProject: { name: 'Marketing Ops', creditsUsed: 3_240, limit: 10_000 },
  },
  'limit-reached': {
    id: 'limit-reached',
    label: 'Limit reached',
    providers: [
      providerStatus({ provider: AIProviderName.OPENAI }),
      providerStatus({ provider: AIProviderName.ANTHROPIC }),
    ],
    chatProvider: AIProviderName.ANTHROPIC,
    routing: { isDefault: false, tiers: builtInTiers() },
    usage: standardUsage().map((row, index) =>
      index === 0
        ? { ...row, creditsUsed: row.limit ?? row.creditsUsed }
        : row,
    ),
    currentProject: { name: 'Marketing Ops', creditsUsed: 10_000, limit: 10_000 },
  },
};

function model(facts: ModelFacts): ModelFacts {
  return facts;
}

function providerStatus({
  provider,
  down,
}: {
  provider: AIProviderName;
  down?: boolean;
}): MockProviderStatus {
  return {
    provider,
    configured: true,
    down,
    usageDashboardUrl: PROVIDER_USAGE_DASHBOARDS[provider],
    monitorGuideUrl: `https://www.activepieces.com/docs/ai/monitor-usage/${provider}`,
  };
}

function builtInTiers({
  singleProvider,
}: { singleProvider?: AIProviderName } = {}): MockTier[] {
  if (singleProvider === AIProviderName.ANTHROPIC) {
    return [
      builtInTier({
        id: 'fast',
        main: { provider: AIProviderName.ANTHROPIC, modelId: 'claude-haiku-4-5' },
        backup1: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-haiku-4-5',
        },
        backup2: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-haiku-4-5',
        },
      }),
      builtInTier({
        id: 'smart',
        main: { provider: AIProviderName.ANTHROPIC, modelId: 'claude-sonnet-4-6' },
        backup1: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-sonnet-4-6',
        },
        backup2: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-sonnet-4-6',
        },
      }),
      builtInTier({
        id: 'premium',
        main: { provider: AIProviderName.ANTHROPIC, modelId: 'claude-opus-4.8' },
        backup1: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-opus-4.8',
        },
        backup2: {
          provider: AIProviderName.ANTHROPIC,
          modelId: 'claude-opus-4.8',
        },
      }),
    ];
  }
  return [
    builtInTier({
      id: 'fast',
      main: { provider: AIProviderName.GOOGLE, modelId: 'gemini-3.0-flash' },
      backup1: { provider: AIProviderName.OPENAI, modelId: 'gpt-5.2-mini' },
      backup2: {
        provider: AIProviderName.OPENROUTER,
        modelId: 'anthropic/claude-haiku-4.5',
      },
    }),
    builtInTier({
      id: 'smart',
      main: { provider: AIProviderName.ANTHROPIC, modelId: 'claude-sonnet-4-6' },
      backup1: { provider: AIProviderName.OPENAI, modelId: 'gpt-5.2' },
      backup2: {
        provider: AIProviderName.OPENROUTER,
        modelId: 'anthropic/claude-sonnet-4.6',
      },
    }),
    builtInTier({
      id: 'premium',
      main: { provider: AIProviderName.ANTHROPIC, modelId: 'claude-opus-4.8' },
      backup1: { provider: AIProviderName.OPENAI, modelId: 'gpt-5.2-pro' },
      backup2: {
        provider: AIProviderName.OPENROUTER,
        modelId: 'anthropic/claude-opus-4.8',
      },
    }),
  ];
}

function builtInTier({
  id,
  main,
  backup1,
  backup2,
}: {
  id: BuiltInTierId;
  main: MockSlot;
  backup1: MockSlot;
  backup2: MockSlot;
}): MockTier {
  return {
    id,
    name: BUILT_IN_TIER_NAMES[id],
    description: BUILT_IN_TIER_DESCRIPTIONS[id],
    builtIn: true,
    slots: { main, backup1, backup2 },
  };
}

function standardUsage(): MockProjectAiUsage[] {
  return [
    {
      id: 'proj-marketing',
      projectId: 'proj-marketing',
      projectName: 'Marketing Ops',
      creditsUsed: 3_240,
      limit: 10_000,
      isEstimate: true,
      lastActivity: '2026-08-05T09:12:00.000Z',
    },
    {
      id: 'proj-support',
      projectId: 'proj-support',
      projectName: 'Customer Support',
      creditsUsed: 8_910,
      limit: 15_000,
      isEstimate: true,
      lastActivity: '2026-08-05T07:48:00.000Z',
    },
    {
      id: 'proj-sales',
      projectId: 'proj-sales',
      projectName: 'Sales Automation',
      creditsUsed: 1_120,
      limit: null,
      isEstimate: false,
      lastActivity: '2026-08-04T18:30:00.000Z',
    },
    {
      id: 'proj-internal',
      projectId: 'proj-internal',
      projectName: 'Internal Tools',
      creditsUsed: 460,
      limit: 2_000,
      isEstimate: true,
      lastActivity: '2026-08-01T11:05:00.000Z',
    },
  ];
}

const PROVIDER_USAGE_DASHBOARDS: Partial<Record<AIProviderName, string>> = {
  [AIProviderName.OPENAI]: 'https://platform.openai.com/usage',
  [AIProviderName.ANTHROPIC]: 'https://console.anthropic.com/settings/usage',
  [AIProviderName.GOOGLE]: 'https://aistudio.google.com/usage',
  [AIProviderName.OPENROUTER]: 'https://openrouter.ai/activity',
  [AIProviderName.MISTRAL]: 'https://console.mistral.ai/usage',
  [AIProviderName.AZURE]: 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement',
  [AIProviderName.BEDROCK]: 'https://console.aws.amazon.com/cost-management/home',
  [AIProviderName.CLOUDFLARE_GATEWAY]: 'https://dash.cloudflare.com/?to=/:account/ai/ai-gateway',
};

const BUILT_IN_TIER_NAMES: Record<BuiltInTierId, string> = {
  fast: 'Fast',
  smart: 'Expert',
  premium: 'Heavy',
};

const BUILT_IN_TIER_DESCRIPTIONS: Record<BuiltInTierId, string> = {
  fast: 'Quick replies for simple tasks',
  smart: 'Best for everyday use',
  premium: 'Highest quality, a bit slower',
};

export type MockScenarioId = (typeof MOCK_SCENARIO_IDS)[number];

export type BuiltInTierId = 'fast' | 'smart' | 'premium';

export type ModelFacts = {
  id: string;
  name: string;
  provider: AIProviderName;
  contextWindow: number;
  cost: { input: number; output: number };
  speed: 'fast' | 'medium' | 'slow';
  vision: boolean;
  imageGeneration: boolean;
  embeddings: boolean;
  detailsUrl: string;
};

export type MockSlot = {
  provider: AIProviderName;
  modelId: string;
  providerDeleted?: boolean;
};

export type MockTier = {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  slots: { main: MockSlot; backup1: MockSlot; backup2: MockSlot };
};

export type MockProviderStatus = {
  provider: AIProviderName;
  configured: boolean;
  down?: boolean;
  usageDashboardUrl?: string;
  monitorGuideUrl?: string;
};

export type MockProjectAiUsage = {
  id: string;
  projectId: string;
  projectName: string;
  creditsUsed: number;
  limit: number | null;
  isEstimate: boolean;
  lastActivity: string;
};

export type MockScenario = {
  id: MockScenarioId;
  label: string;
  providers: MockProviderStatus[];
  chatProvider: AIProviderName | null;
  routing: { isDefault: boolean; tiers: MockTier[] };
  usage: MockProjectAiUsage[];
  currentProject: { name: string; creditsUsed: number; limit: number | null };
};
