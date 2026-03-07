import { JobData, WorkerJobType, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'

export type JobResult = {
    delayInSeconds?: number
    response?: unknown
}

export type JobHandler<T extends JobData = JobData> = {
    readonly jobType: WorkerJobType
    execute(ctx: JobContext, data: T): Promise<JobResult>
}

export type JobContext = {
    apiClient: WorkerToApiContract
    jobId: string
    engineToken: string
    internalApiUrl: string
    publicApiUrl: string
    log: Logger
}
