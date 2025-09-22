import { JobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowJobPreHandler } from './flow-job-pre-handler'
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

export const preHandlers: Record<WorkerJobType, JobPreHandler> = {
    [WorkerJobType.EXECUTE_FLOW]: flowJobPreHandler,
    [WorkerJobType.EXECUTE_POLLING]: scheduledJobPreHandler,
    [WorkerJobType.EXECUTE_WEBHOOK]: defaultPreHandler,
    [WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION]: defaultPreHandler,
    [WorkerJobType.RENEW_WEBHOOK]: defaultPreHandler,
    [WorkerJobType.EXECUTE_AGENT]: defaultPreHandler,
    [WorkerJobType.EXECUTE_VALIDATION]: defaultPreHandler,
    [WorkerJobType.EXECUTE_TRIGGER_HOOK]: defaultPreHandler,
    [WorkerJobType.EXECUTE_PROPERTY]: defaultPreHandler,
    [WorkerJobType.EXECUTE_TOOL]: defaultPreHandler,
}
