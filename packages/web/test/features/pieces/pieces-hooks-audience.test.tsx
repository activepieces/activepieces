/**
 * @vitest-environment jsdom
 */
import { PieceAudienceFilter } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));
vi.mock('@/features/pieces/api/pieces-api', () => ({ piecesApi: { get } }));

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

const AI_ACTION = 'slack_search_messages';

const slack = (includeAiAction: boolean) => ({
  name: 'slack',
  displayName: 'Slack',
  version: '0.18.0',
  actions: {
    slack_send_message: { displayName: 'Send Message' },
    ...(includeAiAction
      ? { [AI_ACTION]: { displayName: 'Search messages' } }
      : {}),
  },
  triggers: {},
});

const wrapper = ({ children }: React.PropsWithChildren) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  get.mockReset();
  get.mockImplementation(({ audience }: { audience?: PieceAudienceFilter }) =>
    Promise.resolve(slack(audience === PieceAudienceFilter.ALL)),
  );
});

describe('usePiece audience cache isolation', () => {
  it('serves the discovery caller a human-filtered piece', async () => {
    const { result } = renderHook(
      () => piecesHooks.usePiece({ name: 'slack', version: '0.18.0' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pieceModel).toBeDefined());
    expect(result.current.pieceModel?.actions[AI_ACTION]).toBeUndefined();
  });

  it('serves the resolver caller the AI action', async () => {
    const { result } = renderHook(
      () =>
        piecesHooks.usePiece({
          name: 'slack',
          version: '0.18.0',
          audience: PieceAudienceFilter.ALL,
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pieceModel).toBeDefined());
    expect(result.current.pieceModel?.actions[AI_ACTION]).toBeDefined();
  });

  it('does not serve a cached human-filtered piece to a resolver in the same client', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const sharedWrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result: discoveryResult } = renderHook(
      () => piecesHooks.usePiece({ name: 'slack', version: '0.18.0' }),
      { wrapper: sharedWrapper },
    );
    await waitFor(() =>
      expect(discoveryResult.current.pieceModel).toBeDefined(),
    );

    const { result: resolverResult } = renderHook(
      () =>
        piecesHooks.usePiece({
          name: 'slack',
          version: '0.18.0',
          audience: PieceAudienceFilter.ALL,
        }),
      { wrapper: sharedWrapper },
    );
    await waitFor(() =>
      expect(resolverResult.current.pieceModel).toBeDefined(),
    );

    expect(resolverResult.current.pieceModel?.actions[AI_ACTION]).toBeDefined();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
