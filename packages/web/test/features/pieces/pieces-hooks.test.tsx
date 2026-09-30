// @vitest-environment jsdom
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
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

describe('usePieceForReconnect', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads the latest version when it still offers the connection auth type', async () => {
    mockGmailVersions({
      latestAuth: [
        { type: PropertyType.OAUTH2 },
        { type: PropertyType.CUSTOM_AUTH },
      ],
    });

    const { result } = renderReconnect({
      connection: { ...PINNED_GMAIL, type: AppConnectionType.CLOUD_OAUTH2 },
    });

    await waitFor(() =>
      expect(result.current.pieceModel?.version).toBe(LATEST_VERSION),
    );
    expect(get).not.toHaveBeenCalledWith(
      expect.objectContaining({ version: PINNED_VERSION }),
    );
  });

  it('keeps the stored version when the latest no longer offers the connection auth type', async () => {
    mockGmailVersions({ latestAuth: { type: PropertyType.SECRET_TEXT } });

    const { result } = renderReconnect({ connection: PINNED_GMAIL });

    await waitFor(() =>
      expect(result.current.pieceModel?.version).toBe(PINNED_VERSION),
    );
  });

  it('keeps the stored version when the latest cannot be loaded', async () => {
    mockGmailVersions({ latestFails: true });

    const { result } = renderReconnect({ connection: PINNED_GMAIL });

    await waitFor(() =>
      expect(result.current.pieceModel?.version).toBe(PINNED_VERSION),
    );
  });

  it('fetches nothing until it is enabled', async () => {
    mockGmailVersions({ latestAuth: { type: PropertyType.OAUTH2 } });

    const { result, rerender } = renderReconnect({
      connection: PINNED_GMAIL,
      enabled: false,
    });
    expect(get).not.toHaveBeenCalled();

    rerender({ connection: PINNED_GMAIL, enabled: true });

    await waitFor(() =>
      expect(result.current.pieceModel?.version).toBe(LATEST_VERSION),
    );
  });

  it('fetches nothing without a connection', () => {
    const { result } = renderReconnect({ connection: null });

    expect(result.current.pieceModel).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  function renderReconnect(initialProps: ReconnectHookProps) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(
      ({ connection, enabled }: ReconnectHookProps) =>
        piecesHooks.usePieceForReconnect({ connection, enabled }),
      { initialProps, wrapper },
    );
  }
});

function mockGmailVersions({
  latestAuth,
  latestFails = false,
}: {
  latestAuth?: unknown;
  latestFails?: boolean;
}) {
  get.mockImplementation(({ version }: { version?: string }) => {
    if (version !== undefined) {
      return Promise.resolve({
        name: GMAIL,
        version,
        auth: [
          { type: PropertyType.OAUTH2 },
          { type: PropertyType.CUSTOM_AUTH },
        ],
      });
    }
    return latestFails
      ? Promise.reject(PIECE_NOT_FOUND_ERROR)
      : Promise.resolve({
          name: GMAIL,
          version: LATEST_VERSION,
          auth: latestAuth,
        });
  });
}

function pieceNamed(name: string): PieceMetadataModelSummary {
  return { name } as PieceMetadataModelSummary;
}

function neverResolves(): Promise<PieceMetadataModelSummary[]> {
  return new Promise(() => undefined);
}

const PROJECT_A = 'project_a';
const PROJECT_B = 'project_b';
const GMAIL = '@activepieces/piece-gmail';
const PINNED_VERSION = '0.12.10';
const LATEST_VERSION = '0.17.0';
const PINNED_GMAIL: ReconnectConnection = {
  pieceName: GMAIL,
  pieceVersion: PINNED_VERSION,
  type: AppConnectionType.OAUTH2,
};
const PIECE_NOT_FOUND_ERROR = { isAxiosError: true, response: { status: 404 } };

type HookProps = {
  projectId: string;
  searchQuery?: string;
};

type ReconnectConnection = Pick<
  AppConnectionWithoutSensitiveData,
  'pieceName' | 'pieceVersion' | 'type'
>;

type ReconnectHookProps = {
  connection: ReconnectConnection | null;
  enabled?: boolean;
};
