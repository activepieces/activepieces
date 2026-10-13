// @vitest-environment jsdom
import {
  ActionBase,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  PackageType,
  PieceCategory,
  PieceSelectorConfig,
  PieceType,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(
  (): {
    selectedTab: string;
    selectedCustomTabId: string | null;
    pinnedPieces: string[];
    pieceSelectorConfig: unknown;
    managePiecesEnabled: boolean;
  } => ({
    selectedTab: 'EXPLORE',
    selectedCustomTabId: null,
    pinnedPieces: [],
    pieceSelectorConfig: null,
    managePiecesEnabled: false,
  }),
);

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));
vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: { managePiecesEnabled: state.managePiecesEnabled },
        pinnedPieces: state.pinnedPieces,
        pieceSelectorConfig: state.pieceSelectorConfig,
      },
    }),
  },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project_1' },
}));
vi.mock('@/features/platform-admin/hooks/ai-provider-hooks', () => ({
  aiProviderQueries: { useProjectAiProviders: () => ({ data: [] }) },
}));
vi.mock(
  '@/features/pieces/stores/piece-selector-tabs-provider',
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    usePieceSelectorTabs: () => ({
      selectedTab: state.selectedTab,
      selectedCustomTabId: state.selectedCustomTabId,
    }),
  }),
);
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: {
    list: async (request: { suggestionType?: string; searchQuery?: string }) =>
      serverSearch({
        pieces:
          request.suggestionType === undefined
            ? SUMMARIES.map(withoutSuggestions)
            : SUMMARIES,
        searchQuery: request.searchQuery,
      }),
    get: async ({ name }: { name: string }) => ({ name, actions: {} }),
  },
}));
vi.mock('@/features/piece-sets/api/piece-sets-api', () => ({
  pieceSetsApi: {
    getForProject: async () => ({
      config: { selectedActions: { [pieceName('jira')]: [] } },
    }),
  },
}));

import {
  PieceSelectorPreview,
  pieceSelectorPreviewUtils,
  usePieceMenuPreviewSteps,
} from '@/app/routes/platform/setup/pieces/piece-selector-preview';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { stepsHooks } from '@/features/pieces/hooks/steps-hooks';
import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';
import { CategorizedStepMetadataWithSuggestions } from '@/features/pieces/types';

const SUMMARIES: PieceMetadataModelSummary[] = [
  summary({ name: 'google-sheets', displayName: 'Google Sheets' }),
  summary({ name: 'slack', displayName: 'Slack' }),
  summary({ name: 'gmail', displayName: 'Gmail' }),
  summary({
    name: 'openai',
    displayName: 'OpenAI',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  }),
  summary({ name: 'trello', displayName: 'Trello' }),
  summary({ name: 'jira', displayName: 'Jira', hiddenBySet: true }),
  summary({ name: 'webflow', displayName: 'Webflow', actions: 0 }),
  summary({
    name: 'ai',
    displayName: 'AI',
    categories: [PieceCategory.UNIVERSAL_AI],
  }),
  summary({
    name: 'http',
    displayName: 'HTTP',
    categories: [PieceCategory.CORE],
  }),
  summary({
    name: 'tables',
    displayName: 'Tables',
    categories: [PieceCategory.CORE],
  }),
  summary({
    name: 'delay',
    displayName: 'Delay',
    categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  }),
];

const CUSTOM_CONFIG: PieceSelectorConfig = {
  tabs: [
    {
      id: 'crm',
      kind: 'CUSTOM',
      title: 'CRM',
      hidden: false,
      pieceNames: [pieceName('gmail'), pieceName('jira')],
      sections: [
        {
          id: 'chat',
          title: 'Chat',
          pieceNames: [pieceName('slack'), pieceName('webflow')],
        },
      ],
    },
  ],
};

const TABS = [
  PieceSelectorTabType.EXPLORE,
  PieceSelectorTabType.APPS,
  PieceSelectorTabType.UTILITY,
  PieceSelectorTabType.AI_AND_AGENTS,
  PieceSelectorTabType.APPROVALS,
  PieceSelectorTabType.CUSTOM,
  PieceSelectorTabType.NONE,
];

describe('piece menu preview', () => {
  beforeEach(() => {
    state.selectedCustomTabId = 'crm';
    state.pieceSelectorConfig = CUSTOM_CONFIG;
    state.managePiecesEnabled = false;
  });

  it('finds pieces by their action names, like the builder search', async () => {
    state.pinnedPieces = [];
    state.selectedTab = PieceSelectorTabType.NONE;
    const builder = await builderMenu('1');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={newQueryClient()}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        stepsHooks.useAllStepsMetadata({
          searchQuery: '1',
          type: 'action',
          enabled: true,
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const preview = names(
      pieceSelectorPreviewUtils.groupForPreview({
        steps: pieceSelectorPreviewUtils.previewSteps({
          steps: [],
          query: '1',
          searchMatches: result.current.metadata,
        }),
        pins: [],
        tabs: CUSTOM_CONFIG.tabs,
        selectedTab: PieceSelectorTabType.NONE,
        selectedCustomTabId: null,
      }),
    );
    expect(preview).toEqual(builder);
    expect(preview.flatMap(([, pieces]) => pieces)).toContain('Slack');
  });

  it('searches piece names and descriptions across every tab', () => {
    expect(
      names(
        pieceSelectorPreviewUtils.groupForPreview({
          steps: pieceSelectorPreviewUtils.previewSteps({
            steps: pieceSelectorPreviewUtils.toPreviewSteps({
              pieces: SUMMARIES.map(withoutSuggestions),
              selectedActions: undefined,
              aiRouterEnabled: false,
            }),
            query: 'sheets',
            searchMatches: undefined,
          }),
          pins: [],
          tabs: CUSTOM_CONFIG.tabs,
          selectedTab: PieceSelectorTabType.NONE,
          selectedCustomTabId: null,
        }),
      ),
    ).toEqual([['All', ['Google Sheets']]]);
  });

  it('shows the configured tabs, hides AI & Agents without AI, and reports clicks', async () => {
    const onSelect = vi.fn();
    render(
      <QueryClientProvider client={newQueryClient()}>
        <PieceSelectorPreview
          tabs={[
            ...CUSTOM_CONFIG.tabs,
            {
              id: 'APPS',
              kind: 'BUILTIN',
              builtinTab: 'APPS',
              title: 'Integrations',
              hidden: false,
            },
            {
              id: 'UTILITY',
              kind: 'BUILTIN',
              builtinTab: 'UTILITY',
              hidden: true,
            },
          ]}
          pins={[]}
          selectedKey={null}
          onSelect={onSelect}
          highlightedKeys={[]}
          flashedPiece={null}
          onTogglePin={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'CRM',
      'Integrations',
      'Explore',
      'Approvals',
    ]);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Integrations' }));
    expect(onSelect).toHaveBeenCalledWith('APPS');
  });

  it('leaves out pieces whose actions the project set hides', async () => {
    state.managePiecesEnabled = true;
    const { result } = renderHook(() => usePieceMenuPreviewSteps(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={newQueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const shown = result.current.steps.map((step) => step.displayName);
    expect(shown).toContain('Slack');
    expect(shown).not.toContain('Jira');
    expect(shown).not.toContain('Webflow');
    expect(result.current.actionCounts.get(pieceName('jira'))).toBe(0);
    expect(result.current.actionCounts.get(pieceName('slack'))).toBe(2);
  });

  for (const pins of [[], [pieceName('trello'), pieceName('slack')]]) {
    for (const tab of TABS) {
      it(`groups the ${tab} tab like the builder${
        pins.length > 0 ? ' with pinned pieces' : ''
      }`, async () => {
        state.pinnedPieces = pins;
        state.selectedTab = tab;
        const builder = await builderMenu();
        const preview = names(
          pieceSelectorPreviewUtils.groupForPreview({
            steps: pieceSelectorPreviewUtils.toPreviewSteps({
              pieces: SUMMARIES.map(withoutSuggestions),
              selectedActions: { [pieceName('jira')]: [] },
              aiRouterEnabled: false,
            }),
            pins,
            tabs: CUSTOM_CONFIG.tabs,
            selectedTab: tab,
            selectedCustomTabId: 'crm',
          }),
        );
        expect(preview).toEqual(builder);
        expect(JSON.stringify(preview)).not.toContain('Jira');
        expect(JSON.stringify(preview)).not.toContain('Webflow');
      });
    }
  }
});

function serverSearch({
  pieces,
  searchQuery,
}: {
  pieces: PieceMetadataModelSummary[];
  searchQuery: string | undefined;
}): PieceMetadataModelSummary[] {
  const needle = searchQuery?.trim().toLowerCase() ?? '';
  if (needle === '') {
    return pieces;
  }
  return SUMMARIES.filter(
    (piece) =>
      piece.displayName.toLowerCase().includes(needle) ||
      (piece.suggestedActions ?? []).some((suggested) =>
        suggested.displayName.toLowerCase().includes(needle),
      ),
  ).filter((piece) =>
    pieces.some((candidate) => candidate.name === piece.name),
  );
}

function newQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

async function builderMenu(searchQuery = ''): Promise<[string, string[]][]> {
  const queryClient = newQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      piecesHooks.usePiecesSearch({
        searchQuery,
        type: 'action',
        shouldCaptureEvent: false,
      }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return names(
    result.current.data.filter((category) => category.metadata.length > 0),
  );
}

function names(
  categories: CategorizedStepMetadataWithSuggestions[],
): [string, string[]][] {
  return categories.map((category) => [
    category.title,
    category.metadata.map((step) => step.displayName),
  ]);
}

function pieceName(name: string): string {
  return `@activepieces/piece-${name}`;
}

function withoutSuggestions(
  piece: PieceMetadataModelSummary,
): PieceMetadataModelSummary {
  return { ...piece, suggestedActions: undefined };
}

function summary({
  name,
  displayName,
  categories = [],
  actions = 2,
  hiddenBySet = false,
}: {
  name: string;
  displayName: string;
  categories?: PieceCategory[];
  actions?: number;
  hiddenBySet?: boolean;
}): PieceMetadataModelSummary {
  const suggested = Array.from({ length: actions }, (_, index) =>
    action(`${displayName} ${index}`),
  );
  return {
    name: pieceName(name),
    displayName,
    description: '',
    logoUrl: '',
    version: '0.1.0',
    authors: [],
    categories,
    actions,
    triggers: 0,
    packageType: PackageType.REGISTRY,
    pieceType: PieceType.OFFICIAL,
    projectUsage: 0,
    contextInfo: undefined,
    suggestedActions: hiddenBySet ? [] : suggested,
  };
}

function action(displayName: string): ActionBase {
  return {
    name: displayName.toLowerCase().replace(/\s/g, '_'),
    displayName,
    description: '',
    props: {},
    requireAuth: false,
  };
}
