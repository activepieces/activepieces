/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigDetail } from '@/app/routes/platform/setup/ai/providers-tab/config-detail';
import { TooltipProvider } from '@/components/ui/tooltip';
import { mutationFeedback } from '@/lib/mutation-feedback';

const state = vi.hoisted(() => ({ onSave: vi.fn() }));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string | number>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/platform-admin', () => ({
  aiProviderApi: { listModelsForConfig: () => Promise.resolve([]) },
  aiProviderKeys: { configModels: (id: string) => ['config-models', id] },
}));
vi.mock('@/features/platform-admin/hooks/ai-provider-hooks', () => ({
  aiProviderQueries: { useAiProviderConfigs: () => ({ data: [] }) },
}));
vi.mock('@/features/platform-admin/hooks/platform-model-tier-hooks', () => ({
  platformModelTierQueries: { useAdminList: () => ({ data: [] }) },
}));
vi.mock('@/features/agents/ai-model/model-meta', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/agents/ai-model/model-meta')
  >();
  return {
    ...actual,
    modelMeta: {
      ...actual.modelMeta,
      keyScopeImpact: () => [
        { tierName: 'Expert', lostProjects: 1, skippedProjects: 0 },
      ],
    },
  };
});
vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/model-selection-panel',
  () => ({ ModelSelectionPanel: () => null }),
);
vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/project-selection-panel',
  () => ({ ProjectSelectionPanel: () => null }),
);
vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/manual-model-list',
  () => ({ ManualModelList: () => null }),
);

const CONFIG: AIProviderWithoutSensitiveData = {
  id: 'k1',
  name: 'Team key',
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
};

beforeEach(() => {
  state.onSave = vi.fn().mockResolvedValue({
    error: mutationFeedback.userError('That name is already taken'),
  });
});

describe('Provider key save confirm', () => {
  it('stays open and shows why the save failed', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TooltipProvider>
            <ConfigDetail
              config={CONFIG}
              info={{
                provider: AIProviderName.ANTHROPIC,
                name: 'Anthropic',
                markdown: '',
                logoUrl: '',
              }}
              projects={[]}
              isSaving={false}
              onSave={(request) => state.onSave(request)}
              onDelete={() => Promise.resolve()}
              onReplaceCredentials={vi.fn()}
              isRechecking={false}
              onRecheck={vi.fn()}
              onBack={vi.fn()}
            />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Renamed key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save anyway' }));

    await waitFor(() => expect(state.onSave).toHaveBeenCalledTimes(1));
    const confirm = screen.getByRole('dialog', {
      name: 'Change which projects can use Team key?',
      hidden: true,
    });
    await waitFor(() =>
      expect(
        within(confirm).getByText('That name is already taken'),
      ).toBeDefined(),
    );
    expect(screen.getAllByText('That name is already taken')).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
