import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

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
    workerId: Type.Optional(Type.String()),
    workerProps: Type.Record(Type.String(), Type.String()),
    ramUsagePercentage: Type.Number(),
    totalAvailableRamInBytes: Type.Number(),
    ip: Type.String(),
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

export const WorkerMachineHealthcheckRequest = MachineInformation

export type WorkerMachineHealthcheckRequest = Static<typeof WorkerMachineHealthcheckRequest>
export const WorkerMachineHealthcheckResponse = Type.Object({
    PUBLIC_URL: Type.String(),
    TRIGGER_TIMEOUT_SECONDS: Type.Number(),
    PAUSED_FLOW_TIMEOUT_DAYS: Type.Number(),
    EXECUTION_MODE: Type.String(),
    FLOW_TIMEOUT_SECONDS: Type.Number(),
    FLOW_WORKER_CONCURRENCY: Type.Number(),
    SCHEDULED_WORKER_CONCURRENCY: Type.Number(),
    AGENTS_WORKER_CONCURRENCY: Type.Number(),
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