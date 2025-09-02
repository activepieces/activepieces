import { PlatformId, ProjectId } from '@activepieces/shared'
import { Dayjs } from 'dayjs'

export enum SystemJobName {
    HARD_DELETE_PROJECT = 'hard-delete-project',
    PIECES_ANALYTICS = 'pieces-analytics',
    PIECES_SYNC = 'pieces-sync',
    TRIAL_TRACKER = 'trial-tracker',
    FILE_CLEANUP_TRIGGER = 'file-cleanup-trigger',
    ISSUES_REMINDER = 'issue-reminder',
    RUN_TELEMETRY = 'run-telemetry',
    AI_USAGE_REPORT = 'ai-usage-report',
    SEVEN_DAYS_IN_TRIAL = 'seven-days-in-trial',
    ONE_DAY_LEFT_ON_TRIAL = 'one-day-left-on-trial',
}

type HardDeleteProjectSystemJobData = {
    projectId: ProjectId
}

type IssuesReminderSystemJobData = {
    projectId: ProjectId
    projectName: string
    platformId: string
}

type AiUsageReportSystemJobData = {
    platformId: PlatformId
    overage: string
    idempotencyKey: string
}

type SevenDaysInTrialEmailSystemJobData = {
    platformId: PlatformId
    email: string
    firstName?: string
}

type OneDayLeftOnTrialEmailSystemJobData = {
    platformId: PlatformId
    email: string
    firstName?: string
}

type SystemJobDataMap = {
    [SystemJobName.HARD_DELETE_PROJECT]: HardDeleteProjectSystemJobData
    [SystemJobName.ISSUES_REMINDER]: IssuesReminderSystemJobData
    [SystemJobName.AI_USAGE_REPORT]: AiUsageReportSystemJobData
    [SystemJobName.PIECES_ANALYTICS]: Record<string, never>
    [SystemJobName.PIECES_SYNC]: Record<string, never>
    [SystemJobName.TRIAL_TRACKER]: Record<string, never>
    [SystemJobName.FILE_CLEANUP_TRIGGER]: Record<string, never>
    [SystemJobName.RUN_TELEMETRY]: Record<string, never>
    [SystemJobName.SEVEN_DAYS_IN_TRIAL]: SevenDaysInTrialEmailSystemJobData
    [SystemJobName.ONE_DAY_LEFT_ON_TRIAL]: OneDayLeftOnTrialEmailSystemJobData
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
}

export type SystemJobSchedule = {
    init(): Promise<void>
    upsertJob<T extends SystemJobName>(params: UpsertJobParams<T>): Promise<void>
    close(): Promise<void>
}
