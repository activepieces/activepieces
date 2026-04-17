import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'
import { EngineResponseStatus } from '../engine/engine-operation'
import { JobData } from './job-data'

export enum WorkerMachineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export enum WorkerMachineType {
    SHARED = 'SHARED',
    DEDICATED = 'DEDICATED',
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
})

export type MachineInformation = z.infer<typeof MachineInformation>

export const WorkerMachine = z.object({
    ...BaseModelSchema,
    information: MachineInformation,
})

export type WorkerMachine = z.infer<typeof WorkerMachine>

export const WorkerMachineWithStatus = WorkerMachine.extend({
    status: z.nativeEnum(WorkerMachineStatus),
    type: z.nativeEnum(WorkerMachineType),
    workerGroupId: z.string().optional(),
})

export type WorkerMachineWithStatus = z.infer<typeof WorkerMachineWithStatus>

export const ConsumeJobRequest = z.object({
    jobId: z.string(),
    jobData: JobData,
    attempsStarted: z.number(),
    engineToken: z.string(),
    token: z.string(),
    queueName: z.string(),
})

export type ConsumeJobRequest = z.infer<typeof ConsumeJobRequest>

export const ConsumeJobResponse = z.object({
    status: z.nativeEnum(EngineResponseStatus),
    errorMessage: z.string().optional(),
    logs: z.string().optional(),
    response: z.unknown().optional(),
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
    BETTERSTACK_HOST: z.string().optional(),
    BETTERSTACK_TOKEN: z.string().optional(),
    OTEL_ENABLED: z.boolean(),
    HYPERDX_TOKEN: z.string().optional(),
    FILE_STORAGE_LOCATION: z.string(),
    S3_USE_SIGNED_URLS: z.string(),
    EVENT_DESTINATION_TIMEOUT_SECONDS: z.number(),
    WORKER_GROUP_ID: z.string().optional(),
    EDITION: z.string(),
    SSRF_PROTECTION_ENABLED: z.boolean(),
    SSRF_ALLOW_LIST: z.array(z.string()),
    PAGE_ONCALL_WEBHOOK: z.string().optional(),
})

export type WorkerSettingsResponse = z.infer<typeof WorkerSettingsResponse>
