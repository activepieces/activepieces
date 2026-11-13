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

describe('authenticationSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    token: userToken({ platformId }),
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

function userToken({ platformId }: { platformId: string }): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: 'user-1', type: 'USER', platform: { id: platformId } }),
    'signature',
  ].join('.');
}
