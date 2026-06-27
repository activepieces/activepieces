import { Permission } from '@activepieces/core-utils';
import { describe, expect, it, vi } from 'vitest';

import { determineDefaultRoute } from '@/lib/route-utils';

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
