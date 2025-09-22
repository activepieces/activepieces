import { FlowStatus, isNil, JobData, PollingJobData} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { jobQueue } from '../../queue/job-queue'
import { JobPreHandler, PreHandlerResult } from './index'


export const scheduledJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, _attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const scheduledJob = job as PollingJobData

        const flow = await flowService(log).getOneById(scheduledJob.flowId)
        if (isNil(flow) || flow?.status === FlowStatus.DISABLED || flow?.publishedVersionId !== scheduledJob.flowVersionId) {
            log.info({
                message: '[WorkerController#removeScheduledJob]',
                flowVersionId: scheduledJob.flowVersionId,
            }, 'removing stale scheduled job')
            await jobQueue(log).removeRepeatingJob({
                flowVersionId: scheduledJob.flowVersionId,
            })
            return {
                shouldSkip: true,
                reason: 'Flow is disabled or version mismatch',
            }
        }

        return { shouldSkip: false }
    },
}



