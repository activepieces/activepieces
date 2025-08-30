import { JobData, QueueName } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { oneTimeJobPreHandler } from './one-time-job-pre-handler'
import { scheduledJobPreHandler } from './scheduled-job-pre-handler'


export type PreHandlerResult = {
    shouldSkip: boolean
    reason?: string
}

export type JobPreHandler = {
    handle: (job: JobData, attemptsStarted: number, log: FastifyBaseLogger) => Promise<PreHandlerResult>
}

const defaultPreHandler: JobPreHandler = {
    handle: async (_job: JobData, _attemptsStarted: number, _log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        return { shouldSkip: false }
    },
}

export const preHandlers: Record<QueueName, JobPreHandler> = {
    [QueueName.ONE_TIME]: oneTimeJobPreHandler,
    [QueueName.SCHEDULED]: scheduledJobPreHandler,
    [QueueName.WEBHOOK]: defaultPreHandler,
    [QueueName.USERS_INTERACTION]: defaultPreHandler,
    [QueueName.AGENTS]: defaultPreHandler,
}
