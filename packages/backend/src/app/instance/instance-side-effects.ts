import {
    CollectionId,
    FlowId,
    FlowVersion,
    FlowVersionState,
    Instance,
    InstanceStatus,
    ProjectId,
} from "@activepieces/shared";
import { In } from "typeorm";
import { logger } from "../helper/logger";
import { flowVersionRepo } from "../flows/flow-version/flow-version-repo";
import { flowVersionService } from "../flows/flow-version/flow-version.service";
import { flowService } from "../flows/flow.service";
import { triggerUtils } from "../helper/trigger-utils";
import { instanceService } from "./instance.service";

export const instanceSideEffects = {
    async enable(instance: Instance): Promise<void> {
        if (
            instance.status === InstanceStatus.DISABLED ||
            instance.flowIdToVersionId == null
        ) {
            return;
        }
        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });

        await lockVersions({
            flowVersions,
        });

        const enableTriggers = flowVersions.map(
            async (flowVersion) =>
                await triggerUtils.enable({
                    collectionId: instance.collectionId,
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
        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });
        const disableTriggers = flowVersions.map((version) => triggerUtils.disable({ collectionId: instance.collectionId, flowVersion: version, projectId: instance.projectId }));
        await Promise.all(disableTriggers);
    },
    async onCollectionDelete({ projectId, collectionId }: { projectId: ProjectId, collectionId: CollectionId }) {
        const instance = await instanceService.getByCollectionId({ projectId, collectionId });
        if (instance !== null) {
            logger.info(`Collection ${collectionId} is deleted, running intstance side effects first`);
            await this.disable(instance);
            logger.info(`Collection ${collectionId} is deleted, finished running the side effects`);
        }
    },
    async onFlowDelete({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }) {
        const flow = await flowService.getOneOrThrow({ projectId, id: flowId });
        const instance = await instanceService.getByCollectionId({ projectId: projectId, collectionId: flow.collectionId });
        if (instance && instance.flowIdToVersionId) {
            const flowVersionId = instance.flowIdToVersionId[flow.id];
            if (flowVersionId) {
                const flowVersion = (await flowVersionService.getOneOrThrow(flowVersionId));
                logger.info(`Flow ${flowId} is deleted, running intstance side effects first`);
                await triggerUtils.disable({ collectionId: instance.collectionId, flowVersion: flowVersion, projectId: instance.projectId })
            }
        }
    }
};

const lockVersions = async ({ flowVersions }: LockVersionsParams): Promise<void> => {

    flowVersions.forEach((flowVersion) => {
        flowVersion.state = FlowVersionState.LOCKED;
    });

    const saveLockedVersions = [
        flowVersionRepo.save(flowVersions),
    ];

    await Promise.all(saveLockedVersions);
};

interface LockVersionsParams {
  flowVersions: FlowVersion[];
}
