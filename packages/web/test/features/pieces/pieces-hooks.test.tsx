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
const get = vi.fn();
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: {
    list: (request: { projectId?: string; searchQuery?: string }) =>
      list(request),
    get: (request: { name: string; version?: string }) => get(request),
  },
}));

const listConnections = vi.fn();
vi.mock('@/features/connections/api/app-connections', () => ({
  appConnectionsApi: {
    list: (request: { pieceName?: string; cursor?: string; limit?: number }) =>
      listConnections(request),
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

describe('usePieceForEmbeddingConnection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    listConnections.mockReset();
    get.mockResolvedValue({ name: 'slack' });
    listConnections.mockImplementation(
      ({ cursor, limit = 10 }: { cursor?: string; limit?: number }) => {
        const start = Number(cursor ?? 0);
        const end = start + limit;
        return Promise.resolve({
          data: CONNECTIONS.slice(start, end),
          next: end < CONNECTIONS.length ? String(end) : null,
          previous: null,
        });
      },
    );
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads the pinned version when the connection is past the first page', async () => {
    const { result } = renderEmbeddingConnection('target_connection');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(get).toHaveBeenCalledWith({ name: 'slack', version: '0.1.0' });
  });

  it('loads the latest version when the connection does not exist', async () => {
    const { result } = renderEmbeddingConnection('missing_connection');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(get).toHaveBeenCalledWith({ name: 'slack' });
  });

  it('skips the connection lookup when no connection name was requested', async () => {
    const { result } = renderEmbeddingConnection(null);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listConnections).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledWith({ name: 'slack' });
  });

  function renderEmbeddingConnection(connectionExternalId: string | null) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(
      () =>
        piecesHooks.usePieceForEmbeddingConnection({
          pieceName: 'slack',
          connectionExternalId,
        }),
      { wrapper },
    );
  }
});

const CONNECTIONS = [
  ...Array.from({ length: 150 }, (_, index) => ({
    externalId: `older_connection_${index}`,
    pieceName: 'slack',
    pieceVersion: '0.2.0',
  })),
  {
    externalId: 'target_connection',
    pieceName: 'slack',
    pieceVersion: '0.1.0',
  },
];

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
