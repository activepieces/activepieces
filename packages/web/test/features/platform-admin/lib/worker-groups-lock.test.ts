import { ApEdition } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  WorkerGroupsLockReason,
  workerGroupsLock,
} from '@/features/platform-admin/lib/worker-groups-lock';

describe('workerGroupsLock.reason', () => {
  it.each([
    [ApEdition.CLOUD, false, WorkerGroupsLockReason.CLOUD],
    [ApEdition.CLOUD, true, WorkerGroupsLockReason.CLOUD],
    [ApEdition.COMMUNITY, false, WorkerGroupsLockReason.COMMUNITY],
    [ApEdition.COMMUNITY, true, null],
    [ApEdition.ENTERPRISE, false, WorkerGroupsLockReason.NOT_IN_PLAN],
    [ApEdition.ENTERPRISE, true, null],
  ])(
    'edition %s, enabled %s → %s',
    (edition, workerGroupsEnabled, expected) => {
      expect(
        workerGroupsLock.reason({ edition, plan: { workerGroupsEnabled } }),
      ).toBe(expected);
    },
  );
});
