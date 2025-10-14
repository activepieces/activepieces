import { FlowStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowCache } from '../../../flows/flow/flow.cache'

export const refillFlowsStatuses = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const flows: { id: string, status: FlowStatus }[] = await flowRepo().find({ select: { id: true, status: true } })

        await flowCache(log).updateManyStatusesCache(flows);

        log.info(
            '[refillFlowsStatuses] Refilled flows statuses in cache',
        )
        return
    },
})
