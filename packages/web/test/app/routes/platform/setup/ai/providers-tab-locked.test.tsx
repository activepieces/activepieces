/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProvidersTab } from '@/app/routes/platform/setup/ai/providers-tab';

const state = vi.hoisted(() => ({
  aiProvidersEnabled: false,
  providers: [] as Record<string, unknown>[],
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { aiProvidersEnabled: state.aiProvidersEnabled } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'cloud' }) },
}));

vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
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
}));

vi.mock('@/features/platform-admin', () => {
  const mutation = () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  });
  return {
    aiProviderKeys: { configModels: () => [] },
    aiProviderQueries: {
      useAiProviderConfigs: () => ({
        data: state.providers,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      }),
    },
    aiProviderMutations: {
      useToggleChatProvider: mutation,
      useDeleteAiProvider: mutation,
      useRecheckAiProvider: mutation,
      useUpdateAiProvider: mutation,
    },
  };
});

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useAllPlatformProjects: () => ({ data: [] }) },
}));

vi.mock('@/features/agents', () => ({
  SUPPORTED_AI_PROVIDERS: [
    { provider: 'anthropic', name: 'Anthropic', markdown: '', logoUrl: '' },
  ],
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: () => null,
}));

vi.mock('@/components/custom/delete-dialog', () => ({
  ConfirmationDeleteDialog: () => null,
}));

vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/connect-provider-dialog',
  () => ({ ConnectProviderDialog: () => null }),
);

vi.mock('@/app/routes/platform/setup/ai/providers-tab/config-detail', () => ({
  ConfigDetail: () => <h1>Key detail</h1>,
}));

function renderTab(path = '/platform/ai') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <ProvidersTab />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const ANTHROPIC_KEY = {
  id: 'key-1',
  provider: 'anthropic',
  name: 'Trial Anthropic key',
  enabledForChat: true,
  status: 'active',
  modelScope: 'all',
  modelIds: [],
  projectScope: 'all',
  projectIds: [],
  config: {},
};

beforeEach(() => {
  state.aiProvidersEnabled = false;
  state.providers = [];
});

describe('providers tab on a plan without aiProvidersEnabled', () => {
  it('lists existing keys with delete only and an upgrade note', () => {
    state.providers = [ANTHROPIC_KEY];

    renderTab();

    expect(
      screen.getByText('Your plan does not include Bring your own AI keys'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Trial Anthropic key').length).toBeGreaterThan(
      0,
    );
    expect(screen.queryAllByRole('combobox')).toEqual([]);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Add key/ })).toEqual([]);
    expect(screen.queryAllByRole('button', { name: /Trial Anthropic/ })).toEqual(
      [],
    );
    expect(screen.queryAllByText('Add a provider')).toEqual([]);
  });

  it('does not open the key detail from a deep link', () => {
    state.providers = [ANTHROPIC_KEY];

    renderTab('/platform/ai?config=key-1');

    expect(screen.queryAllByRole('heading', { name: 'Key detail' })).toEqual(
      [],
    );
  });

  it('shows the locked AI Center card when there is nothing to delete', async () => {
    renderTab();

    expect(
      await screen.findByRole('heading', {
        name: 'Bring your own AI providers',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(
        'Your plan does not include Bring your own AI keys',
      ),
    ).toEqual([]);
  });
});

describe('providers tab on a plan with aiProvidersEnabled', () => {
  it('keeps add, open and connect actions', () => {
    state.aiProvidersEnabled = true;
    state.providers = [ANTHROPIC_KEY];

    renderTab();

    expect(
      screen.getAllByRole('button', { name: /Add key/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByText(
        'Your plan does not include Bring your own AI keys',
      ),
    ).toEqual([]);
    expect(
      screen.queryAllByRole('heading', { name: 'Unlock AI Center' }),
    ).toEqual([]);
  });
});
