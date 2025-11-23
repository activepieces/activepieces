import { PlatformId, ProjectId } from '@activepieces/shared'

export enum SystemJobName {
    PIECES_ANALYTICS = 'pieces-analytics',
    PIECES_SYNC = 'pieces-sync',
    FILE_CLEANUP_TRIGGER = 'file-cleanup-trigger',
    TRIAL_TRACKER = 'trial-tracker',
    ISSUES_SUMMARY = 'issues-summary',
    RUN_TELEMETRY = 'run-telemetry',
    AI_USAGE_REPORT = 'ai-usage-report',
}

type IssuesSummarySystemJobData = {
    projectId: ProjectId
    projectName: string
    platformId: string
}

type AiUsageReportSystemJobData = {
    platformId: PlatformId
    overage: string
    idempotencyKey: string
}

export type SystemJobDataMap = {
    [SystemJobName.ISSUES_SUMMARY]: IssuesSummarySystemJobData
    [SystemJobName.AI_USAGE_REPORT]: AiUsageReportSystemJobData
    [SystemJobName.PIECES_ANALYTICS]: Record<string, never>
    [SystemJobName.PIECES_SYNC]: Record<string, never>
    [SystemJobName.FILE_CLEANUP_TRIGGER]: Record<string, never>
    [SystemJobName.RUN_TELEMETRY]: Record<string, never>
    [SystemJobName.TRIAL_TRACKER]: Record<string, never>
}