import { FlowVersion, ProjectId, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineRunner } from '../../engine'
import { webhookUtils } from '../../utils/webhook-utils'
export async function renewWebhook(params: Params, log: FastifyBaseLogger): Promise<void> {
    const { flowVersion, projectId, simulate } = params
    await engineRunner(log).executeTrigger(params.engineToken, {
        hookType: TriggerHookType.RENEW,
        flowVersion,
        webhookUrl: await webhookUtils(log).getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
        }),
        test: simulate,
        projectId,
    })
}

type Params = {
    engineToken: string
    flowVersion: FlowVersion
    projectId: ProjectId
    simulate: boolean
}
