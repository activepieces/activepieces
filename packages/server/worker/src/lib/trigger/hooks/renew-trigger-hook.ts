import { FlowVersion, ProjectId, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineRunner } from '../../engine'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'
export async function renewWebhook(params: Params, log: FastifyBaseLogger): Promise<void> {
    const { flowVersion, projectId, simulate } = params
    await engineRunner(log).executeTrigger(params.engineToken, {
        hookType: TriggerHookType.RENEW,
        flowVersion,
        webhookUrl: await webhookUtils(log).getWebhookUrl({
            flowId: flowVersion.flowId,
            simulate,
            publicApiUrl: workerMachine.getPublicApiUrl(),
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
