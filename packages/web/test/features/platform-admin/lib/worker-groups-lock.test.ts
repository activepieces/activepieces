import { ApEdition } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { workerGroupsLock } from '@/features/platform-admin/lib/worker-groups-lock';

describe('workerGroupsLock.reason', () => {
  it.each([
    [ApEdition.CLOUD, false, null, 'cloud'],
    [ApEdition.CLOUD, true, 'key', 'cloud'],
    [ApEdition.COMMUNITY, false, null, 'community'],
    [ApEdition.COMMUNITY, true, null, null],
    [ApEdition.COMMUNITY, false, 'key', 'community'],
    [ApEdition.ENTERPRISE, false, null, 'no-license'],
    [ApEdition.ENTERPRISE, false, 'key', 'not-in-license'],
    [ApEdition.ENTERPRISE, true, 'key', null],
    [ApEdition.ENTERPRISE, true, null, null],
  ])(
    'edition %s, enabled %s, license %s → %s',
    (edition, workerGroupsEnabled, licenseKey, expected) => {
      expect(
        workerGroupsLock.reason({
          edition,
          plan: { workerGroupsEnabled, licenseKey },
        }),
      ).toBe(expected);
    },
  );
});
