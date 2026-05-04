import { EngineResponseStatus, JobData, WorkerJobType, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { SandboxManager } from './sandbox-manager'

export enum JobResultKind {
    FIRE_AND_FORGET = 'FIRE_AND_FORGET',
    SYNCHRONOUS = 'SYNCHRONOUS',
}

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
    kind: JobResultKind.FIRE_AND_FORGET
    status: EngineResponseStatus
    logs?: string
}

export type SynchronousJobResult = {
    kind: JobResultKind.SYNCHRONOUS
    status: EngineResponseStatus
    response: unknown
    errorMessage?: string
    logs?: string
}

export type JobResult = FireAndForgetJobResult | SynchronousJobResult

export type JobHandler<T extends JobData = JobData, R extends JobResult = JobResult> = {
    readonly jobType: WorkerJobType
    execute(ctx: JobContext, data: T): Promise<R>
}
