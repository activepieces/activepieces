import { ApEdition, PlatformWithoutSensitiveData } from '@activepieces/shared';

export const workerGroupsLock = {
  reason({
    edition,
    plan,
  }: {
    edition: ApEdition | null | undefined;
    plan: Pick<PlatformWithoutSensitiveData['plan'], 'workerGroupsEnabled'>;
  }): WorkerGroupsLockReason | null {
    if (edition === ApEdition.CLOUD) return WorkerGroupsLockReason.CLOUD;
    if (plan.workerGroupsEnabled) return null;
    if (edition === ApEdition.COMMUNITY)
      return WorkerGroupsLockReason.COMMUNITY;
    return WorkerGroupsLockReason.NOT_IN_PLAN;
  },
};

export enum WorkerGroupsLockReason {
  CLOUD = 'CLOUD',
  COMMUNITY = 'COMMUNITY',
  NOT_IN_PLAN = 'NOT_IN_PLAN',
}
