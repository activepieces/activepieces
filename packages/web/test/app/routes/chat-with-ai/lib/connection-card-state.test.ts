import { describe, expect, it } from 'vitest';

import { resolveConnectionCardState } from '@/app/routes/chat-with-ai/lib/message-parsers';

describe('what the connection card offers', () => {
  it('offers other accounts and a continue only where the caller may choose', () => {
    expect(
      resolveConnectionCardState({
        reconnectOnly: false,
        connectionsFailed: false,
        healthyCount: 3,
      }),
    ).toEqual({
      offersOtherAccounts: true,
      canContinue: true,
      emptyMessage: 'noAccountYet',
    });
  });

  it('never offers another account on a saved agent, because the agent would ignore it', () => {
    const state = resolveConnectionCardState({
      reconnectOnly: true,
      connectionsFailed: false,
      healthyCount: 1,
    });

    expect(state.offersOtherAccounts).toBe(false);
    expect(state.canContinue).toBe(false);
  });

  it('never offers a continue that would send the run back at a broken account', () => {
    for (const healthyCount of [0, 1, 4]) {
      expect(
        resolveConnectionCardState({
          reconnectOnly: true,
          connectionsFailed: false,
          healthyCount,
        }).canContinue,
      ).toBe(false);
    }
  });

  it('offers nothing at all when the accounts could not be loaded', () => {
    expect(
      resolveConnectionCardState({
        reconnectOnly: false,
        connectionsFailed: true,
        healthyCount: 0,
      }),
    ).toEqual({
      offersOtherAccounts: false,
      canContinue: false,
      emptyMessage: 'loadFailed',
    });
  });

  it('says the load failed rather than claiming the agent account is gone', () => {
    expect(
      resolveConnectionCardState({
        reconnectOnly: true,
        connectionsFailed: true,
        healthyCount: 0,
      }).emptyMessage,
    ).toBe('loadFailed');
  });

  it('says the pinned account is gone only when the server actually narrowed', () => {
    expect(
      resolveConnectionCardState({
        reconnectOnly: true,
        connectionsFailed: false,
        healthyCount: 0,
      }).emptyMessage,
    ).toBe('pinnedAccountGone');
  });

  it('keeps a plain chat able to connect one when it has none', () => {
    const state = resolveConnectionCardState({
      reconnectOnly: false,
      connectionsFailed: false,
      healthyCount: 0,
    });

    expect(state.offersOtherAccounts).toBe(true);
    expect(state.canContinue).toBe(false);
    expect(state.emptyMessage).toBe('noAccountYet');
  });
});
