/**
 * @vitest-environment jsdom
 */
import { PresenceUser, WebsocketServerEvent } from '@activepieces/shared';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePresence } from '@/hooks/use-presence';

const socket = vi.hoisted(() => {
  const sent: SentEvent[] = [];
  const client = {
    on: () => client,
    off: () => client,
    emit: (
      name: string,
      payload: unknown,
      ack?: (response: { users: PresenceUser[] }) => void,
    ) => {
      sent.push({ name, payload, ack });
      return client;
    },
  };
  return { client, sent };
});

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socket.client,
  emitInProject: ({ send }: { send: () => void }) => send(),
  dropHeldEmits: () => undefined,
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => 'me' },
}));

describe('usePresence', () => {
  afterEach(() => {
    cleanup();
    socket.sent.splice(0);
  });

  it('shows the other users from the join answer', () => {
    const { result } = renderHook(() => usePresence({ resourceId: 'flow-1' }));

    act(() => joinAck(0)?.({ users: [user('me'), user('other')] }));

    expect(result.current.map(({ userId }) => userId)).toEqual(['other']);
  });

  it('ignores a join answer that arrives after the resource changed', () => {
    const { result, rerender } = renderHook(
      ({ resourceId }) => usePresence({ resourceId }),
      { initialProps: { resourceId: 'flow-1' } },
    );
    rerender({ resourceId: 'flow-2' });

    act(() => joinAck(0)?.({ users: [user('from-flow-1')] }));

    expect(result.current).toEqual([]);
  });
});

function joinAck(index: number) {
  return socket.sent.filter(
    ({ name }) => name === WebsocketServerEvent.JOIN_PRESENCE,
  )[index]?.ack;
}

function user(userId: string): PresenceUser {
  return {
    userId,
    userDisplayName: userId,
    userEmail: `${userId}@example.com`,
    userImageUrl: null,
  };
}

type SentEvent = {
  name: string;
  payload: unknown;
  ack?: (response: { users: PresenceUser[] }) => void;
};
