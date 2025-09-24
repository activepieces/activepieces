import { ConsumeJobResponse, ConsumeJobResponseStatus, isNil, RenewWebhookJobData, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../cache/flow-worker-cache'
import { engineRunner } from '../runner'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'

export const renewWebhookExecutor = (log: FastifyBaseLogger) => ({
    async renewWebhook({ data, engineToken, timeoutInSeconds }: RenewWebhookParams): Promise<ConsumeJobResponse> {
        const { flowVersionId } = data

        const populatedFlow = await flowWorkerCache.getFlow({
            engineToken,
            flowVersionId,
        })
        const flowVersion = populatedFlow?.version
        if (isNil(flowVersion)) {
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }

        log.info({ flowVersionId: data.flowVersionId }, '[FlowQueueConsumer#consumeRenewWebhookJob]')
        const simulate = false
        await engineRunner(log).executeTrigger(engineToken, {
            hookType: TriggerHookType.RENEW,
            flowVersion,
            webhookUrl: await webhookUtils(log).getWebhookUrl({
                flowId: flowVersion.flowId,
                simulate,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            test: simulate,
            projectId: data.projectId,
            timeoutInSeconds,
        })
        return {
            status: ConsumeJobResponseStatus.OK,
        }
    },
})

type RenewWebhookParams = {
    data: RenewWebhookJobData
    engineToken: string
    timeoutInSeconds: number
}