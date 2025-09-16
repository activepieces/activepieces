import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { JobData } from './job-data'

export enum WorkerMachineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}


export const MachineInformation = Type.Object({
    cpuUsagePercentage: Type.Number(),
    diskInfo: Type.Object({
        total: Type.Number(),
        free: Type.Number(),
        used: Type.Number(),
        percentage: Type.Number(),
    }),
    workerId: Type.String(),
    workerProps: Type.Record(Type.String(), Type.String()),
    ramUsagePercentage: Type.Number(),
    totalAvailableRamInBytes: Type.Number(),
    ip: Type.String(),
    totalSandboxes: Type.Number(),
    freeSandboxes: Type.Number(),
})

export type MachineInformation = Static<typeof MachineInformation>

export const WorkerMachine = Type.Object({
    ...BaseModelSchema,
    information: MachineInformation,
})

export type WorkerMachine = Static<typeof WorkerMachine>

export const WorkerMachineWithStatus = Type.Composite([WorkerMachine, Type.Object({
    status: Type.Enum(WorkerMachineStatus),
})])

export type WorkerMachineWithStatus = Static<typeof WorkerMachineWithStatus>

export const ConsumeJobRequest = Type.Object({
    jobId: Type.String(),
    jobData: JobData,
    timeoutInSeconds: Type.Number(),
    attempsStarted: Type.Number(),
    engineToken: Type.String(),
})

export enum ConsumeJobResponseStatus {
    OK = 'OK',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export type ConsumeJobRequest = Static<typeof ConsumeJobRequest>

export const ConsumeJobResponse = Type.Object({
    status: Type.Enum(ConsumeJobResponseStatus),
    errorMessage: Type.Optional(Type.String()),
})

export type ConsumeJobResponse = Static<typeof ConsumeJobResponse>

export const WorkerMachineHealthcheckRequest = MachineInformation

export type WorkerMachineHealthcheckRequest = Static<typeof WorkerMachineHealthcheckRequest>
export const WorkerMachineHealthcheckResponse = Type.Object({
    PUBLIC_URL: Type.String(),
    TRIGGER_TIMEOUT_SECONDS: Type.Number(),
    PAUSED_FLOW_TIMEOUT_DAYS: Type.Number(),
    EXECUTION_MODE: Type.String(),
    FLOW_TIMEOUT_SECONDS: Type.Number(),
    WORKER_CONCURRENCY: Type.Number(),
    LOG_LEVEL: Type.String(),
    LOG_PRETTY: Type.String(),
    ENVIRONMENT: Type.String(),
    APP_WEBHOOK_SECRETS: Type.String(),
    MAX_FILE_SIZE_MB: Type.Number(),
    SANDBOX_MEMORY_LIMIT: Type.String(),
    SANDBOX_PROPAGATED_ENV_VARS: Type.Array(Type.String()),
    PIECES_SOURCE: Type.String(),
    DEV_PIECES: Type.Array(Type.String()),
    SENTRY_DSN: Type.Optional(Type.String()),
    LOKI_PASSWORD: Type.Optional(Type.String()),
    LOKI_URL: Type.Optional(Type.String()),
    LOKI_USERNAME: Type.Optional(Type.String()),
    OTEL_ENABLED: Type.Boolean(),
    HYPERDX_TOKEN: Type.Optional(Type.String()),
    FILE_STORAGE_LOCATION: Type.String(),
    S3_USE_SIGNED_URLS: Type.String(),
})

export type WorkerMachineHealthcheckResponse = Static<typeof WorkerMachineHealthcheckResponse>