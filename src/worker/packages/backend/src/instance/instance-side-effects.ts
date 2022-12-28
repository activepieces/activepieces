import { CollectionVersion, CollectionVersionState, FlowVersion, FlowVersionState, Instance, InstanceStatus } from "shared";
import { In } from "typeorm";
import { collectionVersionRepo } from "../collections/collection-version/collection-version-repo";
import { flowVersionRepo } from "../flows/flow-version/flow-version-repo";
import { triggerUtils } from "../helper/trigger-utils";
import { InstanceSchema } from "./instance-entity";

export const instanceSideEffects = {
    async enable(instance: Partial<InstanceSchema>): Promise<void> {
        if (
            instance.status === InstanceStatus.DISABLED
            || !instance.flowIdToVersionId
            || !instance.collectionVersion
        ) {
            return;
        }

        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });

        await lockVersions({
            collectionVersion: instance.collectionVersion,
            flowVersions,
        });

        const enableTriggers = flowVersions.map(triggerUtils.enable);

        await Promise.all(enableTriggers);
    },

    async disable(instance: Partial<Instance>): Promise<void> {
        if (instance.status === InstanceStatus.DISABLED || !instance.flowIdToVersionId) {
            return;
        }

        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });

        const disableTriggers = flowVersions.map(triggerUtils.disable);

        await Promise.all(disableTriggers);
    }
};

const lockVersions = async ({ collectionVersion, flowVersions }: LockVersionsParams): Promise<void> => {
    collectionVersion.state = CollectionVersionState.LOCKED;

    flowVersions.forEach(flowVersion => {
        flowVersion.state = FlowVersionState.LOCKED;
    });

    const saveLockedVersions = [
        collectionVersionRepo.save(collectionVersion),
        flowVersionRepo.save(flowVersions),
    ];

    await Promise.all(saveLockedVersions);
};

type LockVersionsParams = {
    collectionVersion: CollectionVersion,
    flowVersions: FlowVersion[],
};
