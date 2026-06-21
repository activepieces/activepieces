import { Permission } from '@activepieces/core-utils';
import { describe, expect, it, vi } from 'vitest';

import { CHAT_ROUTE, determineDefaultRoute } from '@/lib/route-utils';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    appendProjectRoutePrefix: (path: string) => path,
  },
}));

const allow =
  (permissions: Permission[]) =>
  (permission: Permission): boolean =>
    permissions.includes(permission);

describe('determineDefaultRoute', () => {
  it('sends users to the chat app when chat is enabled, regardless of permissions', () => {
    expect(
      determineDefaultRoute({ checkAccess: () => true, chatEnabled: true }),
    ).toBe(CHAT_ROUTE);
    expect(
      determineDefaultRoute({ checkAccess: () => false, chatEnabled: true }),
    ).toBe(CHAT_ROUTE);
  });

  it('falls back to permission-based routing when chat is disabled', () => {
    expect(
      determineDefaultRoute({
        checkAccess: allow([Permission.READ_FLOW]),
        chatEnabled: false,
      }),
    ).toBe('/automations');
    expect(
      determineDefaultRoute({
        checkAccess: allow([Permission.READ_RUN]),
        chatEnabled: false,
      }),
    ).toBe('/runs');
    expect(
      determineDefaultRoute({ checkAccess: () => false, chatEnabled: false }),
    ).toBe('/settings');
  });
});
