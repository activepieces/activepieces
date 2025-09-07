import { assertNotNullOrUndefined, ConsumeJobResponse, ConsumeJobResponseStatus, RenewWebhookJobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../cache/flow-worker-cache'
import { triggerHooks } from '../utils/trigger-utils'

export const renewWebhookExecutor = (log: FastifyBaseLogger) => ({
    async renewWebhook({ data, engineToken }: RenewWebhookParams): Promise<ConsumeJobResponse> {
        const { flowVersionId } = data

        const populatedFlow = await flowWorkerCache.getFlow({
            engineToken,
            flowVersionId,
        })
        const flowVersion = populatedFlow?.version ?? null
        assertNotNullOrUndefined(flowVersion, 'flowVersion')

        log.info({ flowVersionId: data.flowVersionId }, '[FlowQueueConsumer#consumeRenewWebhookJob]')
        await triggerHooks(log).renewWebhook({
            engineToken,
            flowVersion,
            projectId: data.projectId,
            simulate: false,
        })
        return {
            status: ConsumeJobResponseStatus.OK,
        }
    },
})

type RenewWebhookParams = {
    data: RenewWebhookJobData
    engineToken: string
}