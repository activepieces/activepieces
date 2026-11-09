// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));

describe('chat panel on sign out', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', userToken());
    window.localStorage.setItem(
      'chat:last-conv:platform-a:user-a',
      'conv-of-user-a',
    );
    window.sessionStorage.setItem('chat:conv', 'conv-of-user-a');
  });

  it('forgets the open chat of the signed out user', async () => {
    const { useChatPanel } = await import(
      '@/features/workspace/lib/chat-panel-open'
    );
    const { authenticationSession } = await import(
      '@/lib/authentication-session'
    );
    expect(useChatPanel.getState().conversationId).toBe('conv-of-user-a');

    authenticationSession.clearSession();

    expect(window.sessionStorage.getItem('chat:conv')).toBeNull();
    expect(useChatPanel.getState().conversationId).toBeNull();
  });

  it('keeps them while the user stays signed in', async () => {
    await import('@/features/workspace/lib/chat-panel-open');
    const { authenticationSession } = await import(
      '@/lib/authentication-session'
    );

    authenticationSession.switchToProject('p2');

    expect(
      window.localStorage.getItem('chat:last-conv:platform-a:user-a'),
    ).toBe('conv-of-user-a');
  });
});

function userToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: 'user-a', type: 'USER', platform: { id: 'platform-a' } }),
    'signature',
  ].join('.');
}
