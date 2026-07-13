import { Permission } from '@activepieces/core-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  CHAT_ROUTE,
  determineDefaultRoute,
  resolveAuthenticatedLanding,
} from '@/lib/route-utils';

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
  it('routes to automations for flow/table access', () => {
    expect(
      determineDefaultRoute({ checkAccess: allow([Permission.READ_FLOW]) }),
    ).toBe('/automations');
    expect(
      determineDefaultRoute({ checkAccess: allow([Permission.READ_TABLE]) }),
    ).toBe('/automations');
  });

  it('falls back to runs, then settings', () => {
    expect(
      determineDefaultRoute({ checkAccess: allow([Permission.READ_RUN]) }),
    ).toBe('/runs');
    expect(determineDefaultRoute({ checkAccess: () => false })).toBe(
      '/settings',
    );
  });
});

describe('resolveAuthenticatedLanding', () => {
  const classicRoute = '/automations';

  it('lands on chat only when a project is selected, not embedded, and chat is on', () => {
    expect(
      resolveAuthenticatedLanding({
        projectId: 'p1',
        isEmbedded: false,
        chatEnabled: true,
        classicRoute,
      }),
    ).toBe(CHAT_ROUTE);
  });

  it('falls through to the classic route when chat is off (CE / EE-no-flag / outside rollout)', () => {
    expect(
      resolveAuthenticatedLanding({
        projectId: 'p1',
        isEmbedded: false,
        chatEnabled: false,
        classicRoute,
      }),
    ).toBe(classicRoute);
  });

  it('never lands an embed on chat, even with chat on', () => {
    expect(
      resolveAuthenticatedLanding({
        projectId: 'p1',
        isEmbedded: true,
        chatEnabled: true,
        classicRoute,
      }),
    ).toBe(classicRoute);
  });

  it('falls through when there is no project selected', () => {
    expect(
      resolveAuthenticatedLanding({
        projectId: null,
        isEmbedded: false,
        chatEnabled: true,
        classicRoute,
      }),
    ).toBe(classicRoute);
  });
});
