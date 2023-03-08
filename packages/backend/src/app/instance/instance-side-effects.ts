import {
    CollectionId,
    CollectionVersion,
    CollectionVersionState,
    FlowId,
    FlowVersion,
    FlowVersionState,
    Instance,
    InstanceStatus,
    ProjectId,
} from "@activepieces/shared";
import { In } from "typeorm";
import { logger } from "../helper/logger";
import { collectionVersionService } from "../collections/collection-version/collection-version.service";
import { flowVersionRepo } from "../flows/flow-version/flow-version-repo";
import { flowVersionService } from "../flows/flow-version/flow-version.service";
import { flowService } from "../flows/flow.service";
import { triggerUtils } from "../helper/trigger-utils";
import { instanceService } from "./instance.service";

export const instanceSideEffects = {
    async enable(instance: Instance): Promise<void> {
        if (
            instance.status === InstanceStatus.DISABLED ||
      instance.flowIdToVersionId == null ||
      instance.collectionVersionId == null
        ) {
            return;
        }
        const collectionVersion = (await collectionVersionService.getOne(instance.collectionVersionId));

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
                    collectionVersion: collectionVersion,
                    projectId: instance.projectId,
                    flowVersion,
                })
        );

        await Promise.all(enableTriggers);
    },

    async disable(instance: Partial<Instance>): Promise<void> {
        if (instance.status === InstanceStatus.DISABLED || instance.flowIdToVersionId == null) {
            return;
        }

        const collectionVersion = (await collectionVersionService.getOneOrThrow(instance.collectionVersionId));
        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });
        const disableTriggers = flowVersions.map((version) => triggerUtils.disable({ collectionId: instance.collectionId, flowVersion: version, projectId: instance.projectId, collectionVersion }));
        await Promise.all(disableTriggers);
    },
    async onCollectionDelete({projectId, collectionId}: {projectId: ProjectId, collectionId: CollectionId}) {
        const instance = await instanceService.getByCollectionId({ projectId, collectionId });
        if (instance !== null) {
            logger.info(`Collection ${collectionId} is deleted, running intstance side effects first`);
            await this.disable(instance);
            logger.info(`Collection ${collectionId} is deleted, finished running the side effects`);
        }
    },
    async onFlowDelete({projectId, flowId}: {projectId: ProjectId, flowId: FlowId}) {
        const flow = await flowService.getOneOrThrow({projectId, id: flowId});
        const instance = await instanceService.getByCollectionId({ projectId: projectId, collectionId: flow.collectionId });
        const flowVersionId = instance.flowIdToVersionId[flow.id];
        if (instance !== null && flowVersionId != null) {
            const collectionVersion = (await collectionVersionService.getOneOrThrow(instance.collectionVersionId));
            const flowVersion = (await flowVersionService.getOneOrThrow(flowVersionId));
            logger.info(`Flow ${flowId} is deleted, running intstance side effects first`);
            await triggerUtils.disable({ collectionId: instance.collectionId, flowVersion: flowVersion, projectId: instance.projectId, collectionVersion })
        }
    }
};

const lockVersions = async ({ collectionVersion, flowVersions }: LockVersionsParams): Promise<void> => {
    collectionVersion.state = CollectionVersionState.LOCKED;

    flowVersions.forEach((flowVersion) => {
        flowVersion.state = FlowVersionState.LOCKED;
    });

    const saveLockedVersions = [
        collectionVersionService.updateVersion(collectionVersion.id, collectionVersion),
        flowVersionRepo.save(flowVersions),
    ];

    await Promise.all(saveLockedVersions);
};

interface LockVersionsParams {
  collectionVersion: CollectionVersion;
  flowVersions: FlowVersion[];
}
