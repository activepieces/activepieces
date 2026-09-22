// @vitest-environment jsdom
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
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
const options = vi.fn();
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: {
    list: (request: { projectId?: string; searchQuery?: string }) =>
      list(request),
    options: (...args: unknown[]) => options(...args),
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

describe('usePieceOptions caching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    options.mockReset();
    options.mockResolvedValue({ type: PropertyType.DYNAMIC, options: {} });
    queryClient = new QueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function renderOptions() {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(
      () =>
        piecesHooks.usePieceOptions({
          onSuccess: () => undefined,
          onError: () => undefined,
          onMutate: () => undefined,
        }),
      { wrapper },
    );
  }

  it('serves a repeated dynamic property from cache without blocking on the network', async () => {
    const { result } = renderOptions();

    const first = await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });
    options.mockResolvedValue({ type: PropertyType.DYNAMIC, options: { added: {} } });
    const second = await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });

    expect(second).toStrictEqual(first);
  });

  it('always revalidates, so a schema that changed upstream is reported back', async () => {
    const { result } = renderOptions();
    const revalidated: unknown[] = [];

    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });
    const changed = { type: PropertyType.DYNAMIC, options: { newField: {} } };
    options.mockResolvedValue(changed);
    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
      onRevalidated: (data) => revalidated.push(data),
    });
    await vi.waitFor(() => expect(revalidated).toHaveLength(1));

    expect(options).toHaveBeenCalledTimes(2);
    expect(revalidated[0]).toStrictEqual(changed);
  });

  it('reports a failed revalidation instead of silently keeping the cached schema', async () => {
    const { result } = renderOptions();
    const failures: Error[] = [];

    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });
    options.mockRejectedValue(new Error('options endpoint is down'));
    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
      onRevalidateFailed: (error) => failures.push(error),
    });
    await vi.waitFor(() => expect(failures).toHaveLength(1));

    options.mockResolvedValue({ type: PropertyType.DYNAMIC, options: {} });
    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });

    expect(options).toHaveBeenCalledTimes(3);
  });

  it('refetches a dynamic property when a refresher changes', async () => {
    const { result } = renderOptions();

    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DYNAMIC,
    });
    await result.current.mutateAsync({
      request: { ...OPTIONS_REQUEST, input: { authType: 'BEARER_TOKEN' } },
      propertyType: PropertyType.DYNAMIC,
    });

    expect(options).toHaveBeenCalledTimes(2);
  });

  it('never serves dropdowns from cache, whose options are live data', async () => {
    const { result } = renderOptions();

    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DROPDOWN,
    });
    await result.current.mutateAsync({
      request: OPTIONS_REQUEST,
      propertyType: PropertyType.DROPDOWN,
    });

    expect(options).toHaveBeenCalledTimes(2);
  });
});

const OPTIONS_REQUEST = {
  projectId: PROJECT_A,
  flowId: 'flow-1',
  flowVersionId: 'flow-version-1',
  pieceName: '@activepieces/piece-http',
  pieceVersion: '0.11.11',
  actionOrTriggerName: 'send_request',
  propertyName: 'authFields',
  input: { authType: 'BASIC' },
};
