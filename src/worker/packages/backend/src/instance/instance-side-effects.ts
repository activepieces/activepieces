import { Instance } from "shared";
import { In } from "typeorm";
import { flowVersionRepo } from "../flows/flow-version/flow-version-repo";
import { triggerUtils } from "../helper/trigger-utils";

export const instanceSideEffects = {
    async enable(instance: Instance): Promise<void> {
        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });

        const enableTriggers = flowVersions
            .map(flowVersion => flowVersion.trigger)
            .map(triggerUtils.enable);

        await Promise.all(enableTriggers);
    },

    async disable(instance: Instance): Promise<void> {
        const flowVersionIds = Object.values(instance.flowIdToVersionId);

        const flowVersions = await flowVersionRepo.findBy({
            id: In(flowVersionIds),
        });

        const disableTriggers = flowVersions
            .map(flowVersion => flowVersion.trigger)
            .map(triggerUtils.disable);

        await Promise.all(disableTriggers);
    }
};
