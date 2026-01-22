import { Flow, FlowId, FlowStatus, ProjectId } from '@activepieces/shared'
import { Job, JobsOptions } from 'bullmq'
import { Dayjs } from 'dayjs'

export enum SystemJobName {
    PIECES_ANALYTICS = 'pieces-analytics',
    PIECES_SYNC = 'pieces-sync',
    FILE_CLEANUP_TRIGGER = 'file-cleanup-trigger',
    TRIAL_TRACKER = 'trial-tracker',
    RUN_TELEMETRY = 'run-telemetry',
    DELETE_FLOW = 'delete-flow',
    UPDATE_FLOW_STATUS = 'update-flow-status',
    AI_CREDIT_UPDATE_CHECK = 'ai-credit-update-check',
}

type DeleteFlowDurableSystemJobData =  {
    flow: Flow
    preDeleteDone: boolean
    dbDeleteDone: boolean
}

type UpdateFlowStatusDurableSystemJobData =  {
    id: FlowId
    projectId: ProjectId
    newStatus: FlowStatus
    preUpdateDone: boolean
}

type AiCreditUpdateCheckSystemJobData = {
    apiKeyHash: string
    platformId: string
}

type SystemJobDataMap = {
    [SystemJobName.PIECES_ANALYTICS]: Record<string, never>
    [SystemJobName.PIECES_SYNC]: Record<string, never>
    [SystemJobName.FILE_CLEANUP_TRIGGER]: Record<string, never>
    [SystemJobName.RUN_TELEMETRY]: Record<string, never>
    [SystemJobName.TRIAL_TRACKER]: Record<string, never>
    [SystemJobName.DELETE_FLOW]: DeleteFlowDurableSystemJobData
    [SystemJobName.UPDATE_FLOW_STATUS]: UpdateFlowStatusDurableSystemJobData
    [SystemJobName.AI_CREDIT_UPDATE_CHECK]: AiCreditUpdateCheckSystemJobData
}

export type SystemJobData<T extends SystemJobName = SystemJobName> = T extends SystemJobName ? SystemJobDataMap[T] : never

export type SystemJobDefinition<T extends SystemJobName> = {
    name: T
    data: SystemJobData<T>
    jobId?: string
}

export type SystemJobHandler<T extends SystemJobName = SystemJobName> = (data: SystemJobData<T>) => Promise<void>

type OneTimeJobSchedule = {
    type: 'one-time'
    date: Dayjs
}

type RepeatedJobSchedule = {
    type: 'repeated'
    cron: string
}

export type JobSchedule = OneTimeJobSchedule | RepeatedJobSchedule

type UpsertJobParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
    customConfig?: JobsOptions
}

export type SystemJobSchedule = {
    init(): Promise<void>
    upsertJob<T extends SystemJobName>(params: UpsertJobParams<T>): Promise<void>
    getJob<T extends SystemJobName>(jobId: string): Promise<Job<SystemJobData<T>> | undefined>
    close(): Promise<void>
}
