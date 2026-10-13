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
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(
  (): {
    selectedTab: string;
    selectedCustomTabId: string | null;
    pinnedPieces: string[];
    pieceSelectorConfig: unknown;
  } => ({
    selectedTab: 'EXPLORE',
    selectedCustomTabId: null,
    pinnedPieces: [],
    pieceSelectorConfig: null,
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
        plan: {},
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
    list: async (request: { suggestionType?: string }) =>
      request.suggestionType === undefined
        ? SUMMARIES.map(withoutSuggestions)
        : SUMMARIES,
  },
}));

import { pieceSelectorPreviewUtils } from '@/app/routes/platform/setup/pieces/piece-selector-preview';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
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
            query: '',
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

async function builderMenu(): Promise<[string, string[]][]> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      piecesHooks.usePiecesSearch({
        searchQuery: '',
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
