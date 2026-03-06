import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'
import { JobData } from './job-data'

export enum WorkerMachineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}


export const MachineInformation = z.object({
    cpuUsagePercentage: z.number(),
    diskInfo: z.object({
        total: z.number(),
        free: z.number(),
        used: z.number(),
        percentage: z.number(),
    }),
    workerId: z.string(),
    workerProps: z.record(z.string(), z.string()),
    ramUsagePercentage: z.number(),
    totalAvailableRamInBytes: z.number(),
    totalCpuCores: z.number(),
    ip: z.string(),
    totalSandboxes: z.number(),
    freeSandboxes: z.number(),
})

export type MachineInformation = z.infer<typeof MachineInformation>

export const WorkerMachine = z.object({
    ...BaseModelSchema,
    information: MachineInformation,
})

export type WorkerMachine = z.infer<typeof WorkerMachine>

export const WorkerMachineWithStatus = WorkerMachine.extend({
    status: z.nativeEnum(WorkerMachineStatus),
})

export type WorkerMachineWithStatus = z.infer<typeof WorkerMachineWithStatus>

export const ConsumeJobRequest = z.object({
    jobId: z.string(),
    jobData: JobData,
    timeoutInSeconds: z.number(),
    attempsStarted: z.number(),
    engineToken: z.string(),
})

export enum ConsumeJobResponseStatus {
    OK = 'OK',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export type ConsumeJobRequest = z.infer<typeof ConsumeJobRequest>

export const ConsumeJobResponse = z.object({
    status: z.nativeEnum(ConsumeJobResponseStatus),
    errorMessage: z.string().optional(),
    delayInSeconds: z.number().optional(),
})


export type ConsumeJobResponse = z.infer<typeof ConsumeJobResponse>

export const WorkerMachineHealthcheckRequest = MachineInformation

export type WorkerMachineHealthcheckRequest = z.infer<typeof WorkerMachineHealthcheckRequest>

export const WorkerSettingsResponse = z.object({
    PUBLIC_URL: z.string(),
    TRIGGER_TIMEOUT_SECONDS: z.number(),
    TRIGGER_HOOKS_TIMEOUT_SECONDS: z.number(),
    PAUSED_FLOW_TIMEOUT_DAYS: z.number(),
    EXECUTION_MODE: z.string(),
    FLOW_TIMEOUT_SECONDS: z.number(),
    WORKER_CONCURRENCY: z.number(),
    LOG_LEVEL: z.string(),
    LOG_PRETTY: z.string(),
    ENVIRONMENT: z.string(),
    APP_WEBHOOK_SECRETS: z.string(),
    MAX_FLOW_RUN_LOG_SIZE_MB: z.number(),
    MAX_FILE_SIZE_MB: z.number(),
    SANDBOX_MEMORY_LIMIT: z.string(),
    SANDBOX_PROPAGATED_ENV_VARS: z.array(z.string()),
    DEV_PIECES: z.array(z.string()),
    SENTRY_DSN: z.string().optional(),
    LOKI_PASSWORD: z.string().optional(),
    LOKI_URL: z.string().optional(),
    LOKI_USERNAME: z.string().optional(),
    OTEL_ENABLED: z.boolean(),
    HYPERDX_TOKEN: z.string().optional(),
    FILE_STORAGE_LOCATION: z.string(),
    S3_USE_SIGNED_URLS: z.string(),
    QUEUE_MODE: z.string().optional(),
    REDIS_TYPE: z.string(),
    REDIS_SSL_CA_FILE: z.string().optional(),
    REDIS_DB: z.number().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_URL: z.string().optional(),
    REDIS_USER: z.string().optional(),
    REDIS_USE_SSL: z.boolean().optional(),
    REDIS_SENTINEL_ROLE: z.string().optional(),
    REDIS_SENTINEL_HOSTS: z.string().optional(),
    REDIS_SENTINEL_NAME: z.string().optional(),
    REDIS_FAILED_JOB_RETENTION_DAYS: z.number(),
    REDIS_FAILED_JOB_RETENTION_MAX_COUNT: z.number(),
    PROJECT_RATE_LIMITER_ENABLED: z.boolean(),
    MAX_CONCURRENT_JOBS_PER_PROJECT: z.number(),
    JWT_SECRET: z.string(),
    EVENT_DESTINATION_TIMEOUT_SECONDS: z.number(),
    PLATFORM_ID_FOR_DEDICATED_WORKER: z.string().optional(),
    EDITION: z.string(),
})

export type WorkerSettingsResponse = z.infer<typeof WorkerSettingsResponse>
