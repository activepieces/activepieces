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
const AI_ACTION_DISPLAY_NAME = 'Search messages in a channel';

const slack = (includeAiAction: boolean) => ({
  name: 'slack',
  displayName: 'Slack',
  actions: {
    slack_send_message: { displayName: 'Send Message' },
    ...(includeAiAction
      ? { [AI_ACTION]: { displayName: AI_ACTION_DISPLAY_NAME } }
      : {}),
  },
  triggers: {},
});

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  get.mockReset();
  get.mockImplementation(({ audience }: { audience?: PieceAudienceFilter }) =>
    Promise.resolve(slack(audience === PieceAudienceFilter.ALL)),
  );
});

describe('useMultiplePieces, used by the MCP activity feed', () => {
  it('requests every audience, so a saved MCP action can be resolved', async () => {
    const { result } = renderHook(
      () =>
        piecesHooks.useMultiplePieces({
          names: ['slack'],
          audience: PieceAudienceFilter.ALL,
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current[0].data).toBeDefined());
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({ audience: PieceAudienceFilter.ALL }),
    );
  });

  it('resolves the display name of an action an MCP agent actually ran', async () => {
    const { result } = renderHook(
      () =>
        piecesHooks.useMultiplePieces({
          names: ['slack'],
          audience: PieceAudienceFilter.ALL,
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current[0].data).toBeDefined());
    const piecesByName = new Map(
      result.current
        .map((query) => query.data)
        .filter((piece) => piece !== undefined)
        .map((piece) => [piece.name, piece]),
    );
    expect(piecesByName.get('slack')?.actions?.[AI_ACTION]?.displayName).toBe(
      AI_ACTION_DISPLAY_NAME,
    );
  });

  it('keeps the default caller human-filtered and does not collide with the resolver', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const sharedWrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result: pickerResult } = renderHook(
      () => piecesHooks.useMultiplePieces({ names: ['slack'] }),
      { wrapper: sharedWrapper },
    );
    await waitFor(() => expect(pickerResult.current[0].data).toBeDefined());
    expect(pickerResult.current[0].data?.actions[AI_ACTION]).toBeUndefined();

    const { result: feedResult } = renderHook(
      () =>
        piecesHooks.useMultiplePieces({
          names: ['slack'],
          audience: PieceAudienceFilter.ALL,
        }),
      { wrapper: sharedWrapper },
    );
    await waitFor(() => expect(feedResult.current[0].data).toBeDefined());

    expect(feedResult.current[0].data?.actions[AI_ACTION]).toBeDefined();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
