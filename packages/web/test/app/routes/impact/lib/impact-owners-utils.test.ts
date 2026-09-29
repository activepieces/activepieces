import {
  FlowStatus,
  PlatformAnalyticsReport,
  PlatformRole,
  UserStatus,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { impactOwnersUtils } from '@/app/routes/impact/lib/impact-owners-utils';

const flow = (
  flowId: string,
  ownerId: string | null,
): PlatformAnalyticsReport['flows'][number] => ({
  flowId,
  flowName: flowId,
  projectId: 'project',
  projectName: 'Project',
  status: FlowStatus.ENABLED,
  timeSavedPerRun: null,
  ownerId,
});

const user = (
  id: string,
  firstName: string,
  lastName: string,
): PlatformAnalyticsReport['users'][number] => ({
  id,
  email: `${id}@example.com`,
  firstName,
  lastName,
  status: UserStatus.ACTIVE,
  externalId: null,
  platformId: 'platform',
  platformRole: PlatformRole.MEMBER,
  created: '2026-09-01T00:00:00.000Z',
  updated: '2026-09-01T00:00:00.000Z',
  lastActiveDate: null,
  imageUrl: null,
});

describe('impactOwnersUtils.listFlowOwners', () => {
  it('names each owner after the user shown in the owner filter', () => {
    const owners = impactOwnersUtils.listFlowOwners({
      flows: [flow('a', 'u1'), flow('b', 'u2'), flow('c', 'u1')],
      users: [user('u1', 'Alice', 'Smith'), user('u2', 'Bob', '')],
    });

    expect(owners).toEqual([
      { id: 'u1', name: 'Alice Smith' },
      { id: 'u2', name: 'Bob' },
    ]);
  });

  it('falls back to the owner id when the user is not in the report', () => {
    const owners = impactOwnersUtils.listFlowOwners({
      flows: [flow('a', 'u9'), flow('b', null)],
      users: [user('u1', 'Alice', 'Smith')],
    });

    expect(owners).toEqual([{ id: 'u9', name: 'u9' }]);
  });

  it('names an owner from any user list passed in, not only the report users', () => {
    const owners = impactOwnersUtils.listFlowOwners({
      flows: [flow('a', 'u9')],
      users: [
        user('u1', 'Alice', 'Smith'),
        { id: 'u9', firstName: 'Zed', lastName: 'Outside' },
      ],
    });

    expect(owners).toEqual([{ id: 'u9', name: 'Zed Outside' }]);
  });
});

describe('impactOwnersUtils.listOwnerIdsMissingFromUsers', () => {
  it('lists each flow owner that the report users do not cover, once', () => {
    const missing = impactOwnersUtils.listOwnerIdsMissingFromUsers({
      flows: [
        flow('a', 'u1'),
        flow('b', 'u9'),
        flow('c', 'u9'),
        flow('d', null),
      ],
      users: [user('u1', 'Alice', 'Smith')],
    });

    expect(missing).toEqual(['u9']);
  });
});
