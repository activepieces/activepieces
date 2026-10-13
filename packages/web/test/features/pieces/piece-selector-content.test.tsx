// @vitest-environment jsdom
import { ActionBase } from '@activepieces/pieces-framework';
import {
  ApEnvironment,
  FlowActionType,
  PackageType,
  PieceCategory,
  PieceSelectorConfig,
  PieceType,
} from '@activepieces/shared';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CategorizedStepMetadataWithSuggestions,
  PrimitiveStepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';

const state = vi.hoisted(
  (): {
    selectedTab: string;
    selectedCustomTabId: string | null;
    environment: string | undefined;
    pinnedPieces: string[];
    pieceSelectorConfig: unknown;
    metadata: unknown[];
  } => ({
    selectedTab: 'EXPLORE',
    selectedCustomTabId: null,
    environment: undefined,
    pinnedPieces: [],
    pieceSelectorConfig: null,
    metadata: [],
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
  flagsHooks: { useFlag: () => ({ data: state.environment }) },
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
vi.mock('@/features/pieces/hooks/steps-hooks', () => ({
  stepsHooks: {
    useAllStepsMetadata: () => ({
      metadata: state.metadata,
      isLoading: false,
    }),
  },
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

import {
  pieceSelectorContent,
  piecesHooks,
} from '@/features/pieces/hooks/pieces-hooks';
import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';

import { legacyPieceSelectorGrouping } from './legacy-piece-selector-grouping';

const PIECES: StepMetadataWithSuggestions[] = [
  piece({ name: 'google-sheets', displayName: 'Google Sheets' }),
  piece({ name: 'slack', displayName: 'Slack' }),
  piece({ name: 'gmail', displayName: 'Gmail' }),
  piece({
    name: 'openai',
    displayName: 'OpenAI',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  }),
  piece({ name: 'trello', displayName: 'Trello' }),
  piece({ name: 'jira', displayName: 'Jira', suggested: false }),
  piece({
    name: 'ai',
    displayName: 'AI',
    categories: [PieceCategory.UNIVERSAL_AI],
  }),
  piece({ name: 'http', displayName: 'HTTP', categories: [PieceCategory.CORE] }),
  piece({
    name: 'tables',
    displayName: 'Tables',
    categories: [PieceCategory.CORE],
  }),
  piece({
    name: 'text-helper',
    displayName: 'Text Helper',
    categories: [PieceCategory.CORE],
  }),
  piece({
    name: 'delay',
    displayName: 'Delay',
    categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  }),
  primitive({ type: FlowActionType.CODE, displayName: 'Code' }),
  primitive({ type: FlowActionType.ROUTER, displayName: 'Router' }),
  primitive({ type: FlowActionType.LOOP_ON_ITEMS, displayName: 'Loop' }),
  primitive({ type: FlowActionType.AI_ROUTER, displayName: 'AI Router' }),
];

const ALL_TABS = [
  PieceSelectorTabType.EXPLORE,
  PieceSelectorTabType.APPS,
  PieceSelectorTabType.UTILITY,
  PieceSelectorTabType.AI_AND_AGENTS,
  PieceSelectorTabType.APPROVALS,
  PieceSelectorTabType.CUSTOM,
  PieceSelectorTabType.NONE,
];

const CUSTOM_CONFIG: PieceSelectorConfig = {
  tabs: [
    {
      id: 'crm',
      kind: 'CUSTOM',
      title: 'CRM',
      hidden: false,
      pieceNames: [pieceName('gmail'), pieceName('google-sheets')],
      sections: [
        {
          id: 'chat',
          title: 'Chat',
          pieceNames: [pieceName('slack'), pieceName('missing')],
        },
        { id: 'empty', title: 'Empty', pieceNames: [pieceName('missing')] },
      ],
    },
  ],
};

describe('add step menu grouping', () => {
  beforeEach(() => {
    state.selectedTab = PieceSelectorTabType.EXPLORE;
    state.selectedCustomTabId = null;
    state.environment = undefined;
    state.pinnedPieces = [];
    state.pieceSelectorConfig = null;
    state.metadata = PIECES;
  });

  it('explore lists popular pieces and the highlights around the primitives', () => {
    expect(builderMenu()).toEqual([
      ['Popular', ['Google Sheets', 'Slack', 'Gmail', 'OpenAI']],
      [
        'Highlights',
        [
          'Router',
          'AI Router',
          'AI',
          'Code',
          'HTTP',
          'Loop',
          'Tables',
          'Text Helper',
        ],
      ],
    ]);
  });

  it('explore puts pinned pieces first and drops them from popular', () => {
    state.pinnedPieces = [pieceName('trello'), pieceName('slack')];
    expect(builderMenu()).toEqual([
      ['Popular', ['Google Sheets', 'Gmail', 'OpenAI']],
      [
        'Highlights',
        [
          'Trello',
          'Slack',
          'Router',
          'AI Router',
          'AI',
          'Code',
          'HTTP',
          'Loop',
          'Tables',
          'Text Helper',
        ],
      ],
    ]);
  });

  it('explore lists every piece in development', () => {
    state.environment = ApEnvironment.DEVELOPMENT;
    expect(builderMenu()).toEqual([
      ['Popular', PIECES.filter(hasSuggestions).map(displayName)],
    ]);
  });

  it('apps lists popular apps then the rest, after any pinned pieces', () => {
    state.selectedTab = PieceSelectorTabType.APPS;
    expect(builderMenu()).toEqual([
      ['Popular', ['Google Sheets', 'Slack', 'Gmail']],
      ['Apps', ['Trello']],
    ]);
    state.pinnedPieces = [pieceName('trello'), pieceName('slack')];
    expect(builderMenu()).toEqual([
      ['Highlights', ['Trello', 'Slack']],
      ['Popular', ['Google Sheets', 'Gmail']],
      ['Apps', []],
    ]);
  });

  it('utility lists utilities then flow controllers', () => {
    state.selectedTab = PieceSelectorTabType.UTILITY;
    expect(builderMenu()).toEqual([
      ['Utility', ['HTTP', 'Tables', 'Text Helper', 'Code']],
      ['Flow Controller', ['Delay', 'Router', 'Loop', 'AI Router']],
    ]);
  });

  it('ai and agents recommends universal AI first', () => {
    state.selectedTab = PieceSelectorTabType.AI_AND_AGENTS;
    expect(builderMenu()).toEqual([
      ['Recommended', ['AI']],
      ['Others', ['OpenAI']],
    ]);
  });

  it('approvals has no piece rows', () => {
    state.selectedTab = PieceSelectorTabType.APPROVALS;
    expect(builderMenu()).toEqual([]);
  });

  it('a custom tab lists its pieces, then each non-empty section', () => {
    state.selectedTab = PieceSelectorTabType.CUSTOM;
    state.selectedCustomTabId = 'crm';
    state.pieceSelectorConfig = CUSTOM_CONFIG;
    expect(builderMenu()).toEqual([
      ['CRM', ['Gmail', 'Google Sheets']],
      ['Chat', ['Slack']],
    ]);
  });

  it('search results list every match under All', () => {
    state.selectedTab = PieceSelectorTabType.NONE;
    expect(builderMenu()).toEqual([
      ['All', PIECES.filter(hasSuggestions).map(displayName)],
    ]);
    state.metadata = [];
    expect(builderMenu()).toEqual([]);
  });

  for (const environment of [undefined, ApEnvironment.DEVELOPMENT]) {
    for (const pins of [[], [pieceName('trello'), pieceName('slack')]]) {
      it(`groups every tab like the base implementation${
        environment ? ' in development' : ''
      }${pins.length > 0 ? ' with pinned pieces' : ''}`, () => {
        state.environment = environment;
        state.pinnedPieces = pins;
        state.pieceSelectorConfig = CUSTOM_CONFIG;
        state.selectedCustomTabId = 'crm';
        for (const tab of ALL_TABS) {
          state.selectedTab = tab;
          expect(builderCategories()).toEqual(
            legacyPieceSelectorGrouping({
              metadata: PIECES,
              platform: {
                pinnedPieces: pins,
                pieceSelectorConfig: CUSTOM_CONFIG,
              },
              selectedTab: tab,
              selectedCustomTabId: 'crm',
              type: 'action',
              environment: environment ?? null,
            }),
          );
        }
      });
    }
  }

  it('categorize is the suggestion filter followed by group', () => {
    for (const tab of ALL_TABS) {
      const input = {
        platform: {
          pinnedPieces: [pieceName('trello')],
          pieceSelectorConfig: CUSTOM_CONFIG,
        },
        selectedTab: tab,
        selectedCustomTabId: 'crm',
        type: 'action' as const,
        environment: null,
      };
      expect(
        pieceSelectorContent.categorize({ ...input, metadata: PIECES }),
      ).toEqual(
        pieceSelectorContent.group({
          ...input,
          metadata: PIECES.filter(hasSuggestions),
        }),
      );
    }
  });
});

function builderCategories(): CategorizedStepMetadataWithSuggestions[] {
  const { result } = renderHook(() =>
    piecesHooks.usePiecesSearch({
      searchQuery: '',
      type: 'action',
      shouldCaptureEvent: false,
    }),
  );
  return result.current.data;
}

function builderMenu(): [string, string[]][] {
  return builderCategories().map((category) => [
    category.title,
    category.metadata.map(displayName),
  ]);
}

function displayName(step: StepMetadataWithSuggestions): string {
  return step.displayName;
}

function hasSuggestions(step: StepMetadataWithSuggestions): boolean {
  return (
    step.type !== FlowActionType.PIECE ||
    (step.suggestedActions ?? []).length > 0
  );
}

function pieceName(name: string): string {
  return `@activepieces/piece-${name}`;
}

function piece({
  name,
  displayName,
  categories = [],
  suggested = true,
}: {
  name: string;
  displayName: string;
  categories?: string[];
  suggested?: boolean;
}): StepMetadataWithSuggestions {
  return {
    type: FlowActionType.PIECE,
    pieceName: pieceName(name),
    pieceVersion: '0.1.0',
    displayName,
    logoUrl: '',
    description: '',
    categories,
    packageType: PackageType.REGISTRY,
    pieceType: PieceType.OFFICIAL,
    auth: undefined,
    suggestedActions: suggested ? [action(displayName)] : [],
  };
}

function primitive({
  type,
  displayName,
}: Pick<PrimitiveStepMetadata, 'type' | 'displayName'>): StepMetadataWithSuggestions {
  return { type, displayName, logoUrl: '', description: '' };
}

function action(pieceDisplayName: string): ActionBase {
  return {
    name: 'run',
    displayName: `Run ${pieceDisplayName}`,
    description: '',
    props: {},
    requireAuth: false,
  };
}
