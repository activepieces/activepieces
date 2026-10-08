/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled */
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
} from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TiersTab } from '@/app/routes/platform/setup/ai/tiers-tab';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KeyModelsById } from '@/features/agents/ai-model/model-meta';

const state = vi.hoisted(() => ({
  tiers: {
    data: undefined as PlatformModelTier[] | undefined,
    isLoading: false,
    isError: false,
    refetch: () => Promise.resolve(),
  },
  configs: {
    data: undefined as AIProviderWithoutSensitiveData[] | undefined,
    isLoading: false,
    isError: false,
    refetch: () => Promise.resolve(),
  },
  keyModels: {} as KeyModelsById,
  projects: [] as { id: string; displayName: string }[],
  configuration: {
    data: { aiSpecificModelsVisible: true } as
      | { aiSpecificModelsVisible: boolean }
      | undefined,
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string, vars?: Record<string, string | number>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

vi.mock('@/features/platform-admin/hooks/platform-model-tier-hooks', () => ({
  platformModelTierKeys: { admin: ['platform-model-tiers', 'admin'] },
  platformModelTierQueries: {
    useAdminList: () => state.tiers,
    useKeyModels: () => state.keyModels,
  },
  platformModelTierMutations: {
    useCreate: () => mutation(),
    useUpdate: () => mutation(),
    useDelete: () => mutation(),
    useSetSpecificModelsVisible: () => mutation(),
    useReorder: () => mutation(),
  },
}));

vi.mock('@/features/platform-admin/hooks/ai-provider-hooks', () => ({
  aiProviderQueries: { useAiProviderConfigs: () => state.configs },
  aiProviderKeys: {
    configModels: (id: string) => ['ai-provider-config-models', id],
  },
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    useAllPlatformProjects: () => ({ data: state.projects }),
  },
}));
vi.mock('@/hooks/platform-configuration-hooks', () => ({
  platformConfigurationHooks: {
    queryKey: ['platform-configuration'],
    useCurrentPlatformConfiguration: () => ({
      ...state.configuration,
      isLoading: false,
    }),
  },
}));

function mutation() {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
}

function renderTab() {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <TiersTab />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.tiers = {
    data: [],
    isLoading: false,
    isError: false,
    refetch: () => Promise.resolve(),
  };
  state.configs = {
    data: [key('k1')],
    isLoading: false,
    isError: false,
    refetch: () => Promise.resolve(),
  };
  state.keyModels = {
    k1: {
      models: [
        model('sonnet', 'Claude Sonnet'),
        model('haiku', 'Claude Haiku'),
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: () => undefined,
    },
  };
  state.configuration = { data: { aiSpecificModelsVisible: true } };
  state.projects = [
    { id: 'A', displayName: 'Sales' },
    { id: 'B', displayName: 'Ops' },
  ];
});

describe('TiersTab states', () => {
  it('shows skeletons while either list loads', () => {
    state.tiers = { ...state.tiers, isLoading: true };
    renderTab();
    expect(screen.getByRole('status', { name: 'Loading tiers' })).toBeDefined();
  });

  it('shows the fetch error placeholder when the tiers list fails', () => {
    state.tiers = { ...state.tiers, data: undefined, isError: true };
    renderTab();
    expect(screen.getByText('Trouble loading tiers')).toBeDefined();
  });

  it('keeps the cards when a refetch fails after data loaded', () => {
    state.tiers = {
      ...state.tiers,
      isError: true,
      data: [
        tier('expert', {
          name: 'Expert',
          entries: [{ configId: 'k1', modelId: 'sonnet' }],
        }),
      ],
    };
    renderTab();
    expect(screen.getByText('Expert')).toBeDefined();
    expect(screen.queryByText('Trouble loading tiers')).toBeNull();
  });

  it('still shows existing tiers when the platform has no own keys left', () => {
    state.configs = { ...state.configs, data: [] };
    state.tiers = {
      ...state.tiers,
      data: [tier('expert', { name: 'Expert', entries: [] })],
    };
    renderTab();
    expect(screen.getByText('Expert')).toBeDefined();
    expect(screen.queryByText('Add a provider key first')).toBeNull();
  });

  it('asks for a provider key when the platform only has the credits key', () => {
    state.configs = {
      ...state.configs,
      data: [key('ap', { provider: AIProviderName.ACTIVEPIECES })],
    };
    renderTab();
    expect(screen.getByText('Add a provider key first')).toBeDefined();
    expect(screen.queryByText('New tier')).toBeNull();
  });

  it('offers the first tier and keeps specific models visible while there are none', () => {
    renderTab();
    expect(screen.getByText('Create your first tier')).toBeDefined();
    const hide = screen.getByRole('tab', { name: 'Hidden' });
    expect(hide.getAttribute('data-disabled')).not.toBeNull();
    expect(screen.getByText('Add a tier before hiding these.')).toBeDefined();
  });

  it('renders cards with badges, the no-fallback hint and the fallback cap', () => {
    state.tiers = {
      ...state.tiers,
      data: [
        tier('expert', {
          name: 'Expert',
          isDefault: true,
          isFast: false,
          thinkingBudget: 8000,
          entries: [{ configId: 'k1', modelId: 'sonnet' }],
        }),
        tier('full', {
          name: 'Full',
          isDefault: false,
          isFast: true,
          entries: ['a', 'b', 'c', 'd', 'e'].map((modelId) => ({
            configId: 'k1',
            modelId,
          })),
        }),
        tier('orphan', {
          name: 'Orphan',
          isDefault: false,
          isFast: false,
          entries: [{ configId: 'missing', modelId: 'x' }],
        }),
      ],
    };
    renderTab();
    expect(screen.getByText('Expert')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
    expect(screen.getByText('Fast')).toBeDefined();
    expect(screen.getByText('Thinking: 8,000')).toBeDefined();
    expect(screen.getAllByText('No fallback model')).toHaveLength(2);
    expect(screen.getByText('Up to 4 fallbacks')).toBeDefined();
    expect(screen.getAllByText('Add fallback')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Warnings' })).toHaveLength(6);
    expect(screen.getByText('Claude Haiku')).toBeDefined();
  });

  it('tells the admin builders only see tiers when specific models are hidden', () => {
    state.tiers = {
      ...state.tiers,
      data: [
        tier('expert', { entries: [{ configId: 'k1', modelId: 'sonnet' }] }),
      ],
    };
    state.configuration = { data: { aiSpecificModelsVisible: false } };
    renderTab();
    expect(screen.getByText('Builders only see tiers.')).toBeDefined();
    expect(screen.getByText('Claude Haiku')).toBeDefined();
  });

  it('warns when a tier is missing from projects its main key does not serve', () => {
    state.configs = {
      ...state.configs,
      data: [key('k1', { projectScope: 'selected', projectIds: ['A'] })],
    };
    state.tiers = {
      ...state.tiers,
      data: [
        tier('expert', { entries: [{ configId: 'k1', modelId: 'sonnet' }] }),
      ],
    };
    renderTab();
    expect(screen.getByText('tierUnavailableInProjects')).toBeDefined();
    expect(screen.getByText('projectsCount')).toBeDefined();
    expect(
      screen.getByRole('combobox', { name: 'Preview as project' }),
    ).toBeDefined();
    expect(screen.getByText('hidingLeavesProjectsEmpty')).toBeDefined();
  });

  it('shows no scope notices or preview when every key serves every project', () => {
    state.tiers = {
      ...state.tiers,
      data: [
        tier('expert', { entries: [{ configId: 'k1', modelId: 'sonnet' }] }),
      ],
    };
    renderTab();
    expect(screen.queryByText('tierUnavailableInProjects')).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Preview as project' }),
    ).toBeNull();
  });
});

function model(id: string, name: string): AIProviderModel {
  return { id, name, type: AIProviderModelType.TEXT };
}

function key(
  id: string,
  overrides: Partial<AIProviderWithoutSensitiveData> = {},
): AIProviderWithoutSensitiveData {
  return {
    id,
    name: `Key ${id}`,
    provider: AIProviderName.ANTHROPIC,
    config: {},
    enabledForChat: false,
    modelScope: 'all',
    modelIds: [],
    projectScope: 'all',
    projectIds: [],
    status: 'active',
    statusReason: null,
    statusUpdated: null,
    ...overrides,
  };
}

function tier(
  id: string,
  overrides: Partial<PlatformModelTier>,
): PlatformModelTier {
  return {
    id,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'p',
    name: id,
    emoji: '⚡',
    description: null,
    position: 0,
    entries: [],
    isDefault: false,
    isFast: false,
    thinkingBudget: null,
    deleted: null,
    replacedBy: null,
    ...overrides,
  };
}
