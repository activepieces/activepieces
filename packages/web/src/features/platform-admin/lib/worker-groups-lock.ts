import { isNil } from '@activepieces/core-utils';
import { ApEdition, PlatformWithoutSensitiveData } from '@activepieces/shared';

export const workerGroupsLock = {
  reason({
    edition,
    plan,
  }: {
    edition: ApEdition | null | undefined;
    plan: Pick<
      PlatformWithoutSensitiveData['plan'],
      'workerGroupsEnabled' | 'licenseKey'
    >;
  }): WorkerGroupsLockReason | null {
    if (edition === ApEdition.CLOUD) return 'cloud';
    if (plan.workerGroupsEnabled) return null;
    if (edition === ApEdition.COMMUNITY) return 'community';
    return isNil(plan.licenseKey) ? 'no-license' : 'not-in-license';
  },
};

export type WorkerGroupsLockReason =
  | 'cloud'
  | 'community'
  | 'no-license'
  | 'not-in-license';
