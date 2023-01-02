import {
  CollectionVersion,
  CollectionVersionState,
  FlowVersion,
  FlowVersionState,
  Instance,
  InstanceStatus,
} from "shared";
import { In } from "typeorm";
import { collectionVersionRepo } from "../collections/collection-version/collection-version-repo";
import { flowVersionRepo } from "../flows/flow-version/flow-version-repo";
import { triggerUtils } from "../helper/trigger-utils";

export const instanceSideEffects = {
  async enable(instance: Instance): Promise<void> {
    if (
      instance.status === InstanceStatus.DISABLED ||
      instance.flowIdToVersionId == null ||
      instance.collectionVersionId == null
    ) {
      return;
    }
    const collectionVersion = (await collectionVersionRepo.findOneBy({
      id: instance.collectionVersionId,
    }))!;

    const flowVersionIds = Object.values(instance.flowIdToVersionId);

    const flowVersions = await flowVersionRepo.findBy({
      id: In(flowVersionIds),
    });

    await lockVersions({
      collectionVersion,
      flowVersions,
    });

    const enableTriggers = flowVersions.map(
      async (flowVersion) =>
        await triggerUtils.enable({
          collectionId: instance.collectionId,
          collectionVersionId: instance.collectionVersionId,
          flowVersion,
        })
    );

    await Promise.all(enableTriggers);
  },

  async disable(instance: Partial<Instance>): Promise<void> {
    if (instance.status === InstanceStatus.DISABLED || instance.flowIdToVersionId == null) {
      return;
    }

    const flowVersionIds = Object.values(instance.flowIdToVersionId);

    const flowVersions = await flowVersionRepo.findBy({
      id: In(flowVersionIds),
    });

    const disableTriggers = flowVersions.map((version) => triggerUtils.disable(instance.collectionId!, version));

    await Promise.all(disableTriggers);
  },
};

const lockVersions = async ({ collectionVersion, flowVersions }: LockVersionsParams): Promise<void> => {
  collectionVersion.state = CollectionVersionState.LOCKED;

  flowVersions.forEach((flowVersion) => {
    flowVersion.state = FlowVersionState.LOCKED;
  });

  const saveLockedVersions = [collectionVersionRepo.save(collectionVersion), flowVersionRepo.save(flowVersions)];

  await Promise.all(saveLockedVersions);
};

interface LockVersionsParams {
  collectionVersion: CollectionVersion;
  flowVersions: FlowVersion[];
}
