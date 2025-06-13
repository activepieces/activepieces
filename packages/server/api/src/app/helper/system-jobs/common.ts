import { ProjectId } from '@activepieces/shared'
import { Dayjs } from 'dayjs'

export enum SystemJobName {
    HARD_DELETE_PROJECT = 'hard-delete-project',
    PLATFORM_USAGE_REPORT = 'platform-usage-report',
    PIECES_ANALYTICS = 'pieces-analytics',
    PIECES_SYNC = 'pieces-sync',
    TRIAL_TRACKER = 'trial-tracker',
    FILE_CLEANUP_TRIGGER = 'file-cleanup-trigger',
    ISSUES_REMINDER = 'issue-reminder',
    RUN_TELEMETRY = 'run-telemetry',
    ISSUE_AUTO_ARCHIVE = 'archive-old-issues',
}

type HardDeleteProjectSystemJobData = {
    projectId: ProjectId
}
type IssuesReminderSystemJobData = {
    projectId: ProjectId
    projectName: string
    platformId: string
}

type SystemJobDataMap = {
    [SystemJobName.HARD_DELETE_PROJECT]: HardDeleteProjectSystemJobData
    [SystemJobName.ISSUES_REMINDER]: IssuesReminderSystemJobData
    [SystemJobName.PLATFORM_USAGE_REPORT]: Record<string, never>
    [SystemJobName.PIECES_ANALYTICS]: Record<string, never>
    [SystemJobName.PIECES_SYNC]: Record<string, never>
    [SystemJobName.TRIAL_TRACKER]: Record<string, never>
    [SystemJobName.FILE_CLEANUP_TRIGGER]: Record<string, never>
    [SystemJobName.RUN_TELEMETRY]: Record<string, never>
    [SystemJobName.ISSUE_AUTO_ARCHIVE]: Record<string, never>
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
