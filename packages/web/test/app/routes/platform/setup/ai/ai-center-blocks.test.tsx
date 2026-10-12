/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CapabilitiesTab } from '@/app/routes/platform/setup/ai/capabilities-tab';
import { ProvidersTab } from '@/app/routes/platform/setup/ai/providers-tab';

const state = vi.hoisted(() => ({
  providers: [] as Record<string, unknown>[],
  toolConfigs: [] as Record<string, unknown>[],
}));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { aiProvidersEnabled: true } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'cloud' }) },
}));

vi.mock('@/features/billing', () => ({
  PLATFORM_FEATURES: {
    aiProviders: {
      featureKey: 'UNIVERSAL_AI',
      title: 'Unlock AI Center',
      description: 'description',
      tier: 'plus',
    },
  },
  TIER_LABELS: { plus: 'Plus' },
  useUpgradeClick: () => vi.fn(),
  RequestTrial: () => null,
  useEnterpriseGate: ({ unlocked }: { unlocked: boolean }) => ({
    access: unlocked ? 'entitled' : 'trial_available',
    locked: !unlocked,
    run: vi.fn(),
    explain: vi.fn(),
  }),
}));

vi.mock('@/features/platform-admin', () => {
  const mutation = () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  });
  return {
    aiProviderApi: { update: vi.fn(), delete: vi.fn() },
    aiProviderKeys: { configModels: () => [] },
    aiProviderQueries: {
      useAiProviderConfigs: () => ({
        data: state.providers,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      }),
    },
    aiProviderMutations: { useRecheckAiProvider: mutation },
    aiToolConfigApi: { delete: vi.fn() },
    aiToolConfigQueries: {
      useAiToolConfigs: () => ({
        data: state.toolConfigs,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      }),
    },
  };
});

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useAllPlatformProjects: () => ({ data: [] }) },
}));

vi.mock('@/features/agents', () => ({
  SUPPORTED_AI_PROVIDERS: [
    { provider: 'google', name: 'Google Gemini', markdown: '', logoUrl: '' },
    { provider: 'openai', name: 'OpenAI', markdown: '', logoUrl: '' },
    { provider: 'mistral', name: 'Mistral AI', markdown: '', logoUrl: '' },
    { provider: 'anthropic', name: 'Anthropic', markdown: '', logoUrl: '' },
  ],
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: () => null,
}));

vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/connect-provider-dialog',
  () => ({ ConnectProviderDialog: () => null }),
);

vi.mock('@/app/routes/platform/setup/ai/providers-tab/config-detail', () => ({
  ConfigDetail: () => <h1>Key detail</h1>,
}));

vi.mock(
  '@/app/routes/platform/setup/ai-capabilities/ai-capability-dialog',
  () => ({
    AiCapabilityDialog: ({ children }: React.PropsWithChildren) => (
      <>{children}</>
    ),
  }),
);

const GEMINI_KEY = {
  id: 'key-1',
  provider: 'google',
  name: 'Team Gemini key',
  enabledForChat: false,
  status: 'active',
  modelScope: 'all',
  modelIds: [],
  projectScope: 'all',
  projectIds: [],
  config: {},
};

function renderWithProviders(node: React.ReactNode) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/platform/ai']}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function providerNames(): string[] {
  const panel = screen.getByRole('region', { name: 'Add a provider' });
  return within(panel)
    .getAllByRole('group')
    .map((row) => row.getAttribute('aria-labelledby') ?? '')
    .map((id) => document.getElementById(id)?.textContent ?? '');
}

beforeEach(() => {
  state.providers = [];
  state.toolConfigs = [];
});

describe('AI Center providers on the admin blocks', () => {
  it('lists recommended providers first, emphasised, while no key is connected', () => {
    renderWithProviders(<ProvidersTab />);

    expect(providerNames()).toEqual([
      'AnthropicRecommended',
      'OpenAIRecommended',
      'Google Gemini',
      'Mistral AI',
    ]);
    expect(screen.getAllByText('Recommended')).toHaveLength(2);
  });

  it('shows the add-a-provider panel without emphasis once a key exists', () => {
    state.providers = [GEMINI_KEY];

    renderWithProviders(<ProvidersTab />);

    expect(
      screen.getByRole('region', { name: 'Add a provider' }),
    ).toBeDefined();
    expect(providerNames()).toEqual(['Anthropic', 'OpenAI', 'Mistral AI']);
    expect(screen.queryAllByText('Recommended')).toEqual([]);
  });

  it('opens a key from its name button, not from a clickable row', () => {
    state.providers = [GEMINI_KEY];

    renderWithProviders(<ProvidersTab />);

    const open = screen.getByRole('button', { name: 'Team Gemini key' });
    expect(open.tagName).toBe('BUTTON');
    expect(open.closest('[role="button"]')).toBeNull();
    fireEvent.click(open);
    expect(screen.getByRole('heading', { name: 'Key detail' })).toBeDefined();
  });
});

describe('AI Center capabilities on the admin blocks', () => {
  it('shows one row per capability with its state on its own line', () => {
    renderWithProviders(<CapabilitiesTab />);

    const row = screen.getByRole('group', { name: 'Web Search' });
    expect(
      within(row).getByText("Not connected · The assistant can't do this yet"),
    ).toBeDefined();
    expect(within(row).getByRole('button', { name: 'Connect' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(3);
  });
});
