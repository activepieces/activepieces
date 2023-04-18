import { Flow, WebhookSimulation } from '@activepieces/shared'
import { flowService } from '../../flows/flow/flow.service'
import { triggerUtils } from '../../helper/trigger-utils'

const getFlowOrThrow = async (webhookSimulation: WebhookSimulation): Promise<Flow> => {
    return await flowService.getOneOrThrow({
        id: webhookSimulation.flowId,
        projectId: webhookSimulation.projectId,
    })
}

export const webhookSideEffects = {
    async onCreate(webhookSimulation: WebhookSimulation): Promise<void> {
        const { projectId, collectionId, version: flowVersion } = await getFlowOrThrow(webhookSimulation)

        await triggerUtils.enable({
            projectId,
            collectionId,
            flowVersion,
            simulate: true,
        })
    },

    async onDelete(webhookSimulation: WebhookSimulation): Promise<void> {
        const { projectId, collectionId, version: flowVersion } = await getFlowOrThrow(webhookSimulation)

        await triggerUtils.disable({
            projectId,
            collectionId,
            flowVersion,
            simulate: true,
        })
    },
}
