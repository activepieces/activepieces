import { Dayjs } from 'dayjs'

export enum SystemJobName {
    HARD_DELETE_PROJECT = 'hard-delete-project',
    PROJECT_USAGE_REPORT = 'project-usage-report',
    USAGE_REPORT = 'usage-report',
    PIECES_ANALYTICS = 'pieces-analytics',
    PIECES_SYNC = 'pieces-sync',
    TRIAL_TRACKER = 'trial-tracker',
    TRIGGER_DATA_CLEANER = 'trigger-data-cleaner',
    ISSUES_REMINDER = 'issues-reminder',
}

export type SystemJobData<T = any> = T

export type SystemJobDefinition<T extends SystemJobName, D = SystemJobData> = {
    name: T
    data: D
    jobId?: string
}

export type SystemJobHandler<T = any> = (data: T) => Promise<void>

type OneTimeJobSchedule = {
    type: 'one-time'
    date: Dayjs
}

type RepeatedJobSchedule = {
    type: 'repeated'
    cron: string
}

export type JobSchedule =
    | OneTimeJobSchedule
    | RepeatedJobSchedule

type UpsertJobParams<T extends SystemJobName, D = SystemJobData> = {
    job: SystemJobDefinition<T, D>
    schedule: JobSchedule
}

export type SystemJobSchedule = {
    init(): Promise<void>
    upsertJob<T extends SystemJobName, D = SystemJobData>(params: UpsertJobParams<T, D>): Promise<void>
    close(): Promise<void>
}
