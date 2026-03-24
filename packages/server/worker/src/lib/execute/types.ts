import { EngineResponseStatus, JobData, WorkerJobType, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { SandboxManager } from './sandbox-manager'

export type JobContext = {
    apiClient: WorkerToApiContract
    sandboxManager: SandboxManager
    jobId: string
    engineToken: string
    internalApiUrl: string
    publicApiUrl: string
    log: Logger
}

export type FireAndForgetJobResult = {
    delayInSeconds?: number
}

export type SynchronousJobResult = {
    status: EngineResponseStatus
    response: unknown
}

export type JobResult = FireAndForgetJobResult | SynchronousJobResult

export type JobHandler<T extends JobData = JobData, R extends JobResult = JobResult> = {
    readonly jobType: WorkerJobType
    execute(ctx: JobContext, data: T): Promise<R>
}
