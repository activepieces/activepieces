// @vitest-environment jsdom
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  platformHooks: { useCurrentPlatform: () => ({ platform: { plan: {} } }) },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'fallback_project' },
}));
vi.mock('@/features/pieces/stores/piece-selector-tabs-provider', () => ({
  PieceSelectorTabType: {},
  usePieceSelectorTabs: () => ({
    selectedTab: undefined,
    selectedCustomTabId: undefined,
  }),
}));

const list = vi.fn();
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: {
    list: (request: { projectId?: string; searchQuery?: string }) =>
      list(request),
  },
}));

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

describe('usePieces with keepPreviousResults', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    list.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('drops the previous project rows while the new project is pending', async () => {
    list.mockImplementation(({ projectId }: { projectId?: string }) =>
      projectId === PROJECT_A
        ? Promise.resolve([pieceNamed('slack')])
        : neverResolves(),
    );

    const { result, rerender } = renderPieces({ projectId: PROJECT_A });
    await waitFor(() => expect(result.current.pieces).toHaveLength(1));

    rerender({ projectId: PROJECT_B });

    expect(result.current.pieces).toBeUndefined();
  });

  it('keeps the rows while only the search term changes', async () => {
    list.mockImplementation(({ searchQuery }: { searchQuery?: string }) =>
      searchQuery === undefined
        ? Promise.resolve([pieceNamed('slack')])
        : neverResolves(),
    );

    const { result, rerender } = renderPieces({ projectId: PROJECT_A });
    await waitFor(() => expect(result.current.pieces).toHaveLength(1));

    rerender({ projectId: PROJECT_A, searchQuery: 'send' });

    expect(result.current.pieces).toEqual([pieceNamed('slack')]);
  });

  function renderPieces(initialProps: HookProps) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(
      ({ projectId, searchQuery }: HookProps) =>
        piecesHooks.usePieces({
          projectId,
          searchQuery,
          keepPreviousResults: true,
        }),
      { initialProps, wrapper },
    );
  }
});

function pieceNamed(name: string): PieceMetadataModelSummary {
  return { name } as PieceMetadataModelSummary;
}

function neverResolves(): Promise<PieceMetadataModelSummary[]> {
  return new Promise(() => undefined);
}

const PROJECT_A = 'project_a';
const PROJECT_B = 'project_b';

type HookProps = {
  projectId: string;
  searchQuery?: string;
};
