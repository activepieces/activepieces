/**
 * @vitest-environment jsdom
 */
import {
  AuthenticationResponse,
  PlatformRole,
  UserStatus,
} from '@activepieces/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticationApi } from '@/api/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';

vi.mock('@/api/authentication-api', () => ({
  authenticationApi: {
    switchPlatform: vi.fn(),
  },
}));

vi.mock('@/app/query-client', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

const switchPlatform = vi.mocked(authenticationApi.switchPlatform);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('authenticationSession', () => {
  beforeEach(() => {
    window.localStorage.setItem('projectId', 'project-on-previous-platform');
    vi.stubGlobal('location', { href: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    switchPlatform.mockReset();
  });

  it('forgets the previous project when switching to a platform where they have none', async () => {
    switchPlatform.mockResolvedValue(
      switchResponse({ platformId: 'platform-b', projectId: null }),
    );

    await authenticationSession.switchToPlatform('platform-b');

    expect(authenticationSession.getProjectId()).toBeNull();
  });

  it('saves the project the switch lands in', async () => {
    switchPlatform.mockResolvedValue(
      switchResponse({ platformId: 'platform-b', projectId: 'project-b' }),
    );

    await authenticationSession.switchToPlatform('platform-b');

    expect(authenticationSession.getProjectId()).toBe('project-b');
  });

  it('forgets the previous project when signing in lands where they have none', () => {
    authenticationSession.saveResponse(
      switchResponse({ platformId: 'platform-b', projectId: null }),
      false,
    );

    expect(authenticationSession.getProjectId()).toBeNull();
  });
});

describe('authenticationSession.subscribe', () => {
  beforeEach(() => {
    signIn({ userId: 'user-1' });
    authenticationSession.setProjectId('a');
  });

  it('notifies for changes made in this tab', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('b');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('ignores storage events from other tabs', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    localStorage.setItem('projectId', 'other');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'projectId', newValue: 'other' }),
    );
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('does not notify when switching to the stored project', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('a');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe('authenticationSession.getProjectId', () => {
  beforeEach(() => {
    signIn({ userId: 'user-1' });
    authenticationSession.setProjectId('a');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('uses the project in the URL over the stored one', () => {
    window.history.replaceState(
      null,
      '',
      '/projects/route-project/automations',
    );
    expect(authenticationSession.getProjectId()).toBe('route-project');
  });

  it('keeps the URL project when another tab stores a different one', () => {
    window.history.replaceState(null, '', '/projects/route-project/runs');
    localStorage.setItem('projectId', 'other');
    expect(authenticationSession.getProjectId()).toBe('route-project');
  });

  it('falls back to the stored project on pages without one', () => {
    window.history.replaceState(null, '', '/impact');
    expect(authenticationSession.getProjectId()).toBe('a');
  });

  it('returns null without a token', () => {
    localStorage.removeItem('token');
    window.history.replaceState(null, '', '/projects/route-project');
    expect(authenticationSession.getProjectId()).toBeNull();
  });
});

describe('authenticationSession per-tab project', () => {
  beforeEach(() => {
    signIn({ userId: 'user-1' });
    window.history.replaceState(null, '', '/impact');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('keeps this tab on its project when another tab switches', () => {
    authenticationSession.switchToProject('tab-a-project');
    switchInAnotherTab({ projectId: 'tab-b-project' });

    expect(authenticationSession.getProjectId()).toBe('tab-a-project');
  });

  it('seeds a new tab from the last project used in any tab', () => {
    authenticationSession.switchToProject('tab-a-project');
    switchInAnotherTab({ projectId: 'tab-b-project' });
    window.sessionStorage.clear();

    expect(authenticationSession.getProjectId()).toBe('tab-b-project');
  });

  it('keeps the seeded project after another tab switches', () => {
    window.localStorage.setItem('projectId', 'seed-project');
    expect(authenticationSession.getProjectId()).toBe('seed-project');

    switchInAnotherTab({ projectId: 'tab-b-project' });

    expect(authenticationSession.getProjectId()).toBe('seed-project');
  });

  it('drops the tab project when another user signs in', () => {
    authenticationSession.switchToProject('tab-a-project');
    signIn({ userId: 'user-2' });
    switchInAnotherTab({ projectId: 'user-2-project' });

    expect(authenticationSession.getProjectId()).toBe('user-2-project');
  });

  it('forgets the tab project on sign out', () => {
    authenticationSession.switchToProject('tab-a-project');
    authenticationSession.clearSession();
    signIn({ userId: 'user-1' });
    switchInAnotherTab({ projectId: 'tab-b-project' });

    expect(authenticationSession.getProjectId()).toBe('tab-b-project');
  });
});

function signIn({ userId }: { userId: string }): void {
  window.localStorage.setItem(
    'token',
    userToken({ platformId: 'platform-a', userId }),
  );
}

function switchInAnotherTab({ projectId }: { projectId: string }): void {
  window.localStorage.setItem('projectId', projectId);
}

function switchResponse({
  platformId,
  projectId,
}: {
  platformId: string;
  projectId: string | null;
}): AuthenticationResponse {
  return {
    id: 'user-1',
    platformId,
    projectId,
    token: userToken({ platformId, userId: 'user-1' }),
    platformRole: PlatformRole.MEMBER,
    status: UserStatus.ACTIVE,
    externalId: null,
    verified: true,
    firstName: 'Maya',
    lastName: 'Doe',
    email: 'maya@example.com',
    trackEvents: false,
    newsLetter: false,
  };
}

function userToken({
  platformId,
  userId,
}: {
  platformId: string;
  userId: string;
}): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: userId, type: 'USER', platform: { id: platformId } }),
    'signature',
  ].join('.');
}
