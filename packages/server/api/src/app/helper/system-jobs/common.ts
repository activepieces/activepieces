
import { Dayjs } from 'dayjs'
import { ProjectId } from '@activepieces/shared'

export type SystemJobName =
    | 'hard-delete-project'
    | 'project-usage-report'
    | 'usage-report'
    | 'pieces-analytics'
    | 'pieces-sync'
    | 'trigger-data-cleaner'

type HardDeleteProjectSystemJobData = {
    projectId: ProjectId
}

type ProjectUsageReportSystemJobData = Record<string, never>
type UsageReportSystemJobData = Record<string, never>

export type SystemJobData<T extends SystemJobName = SystemJobName> =
    T extends 'hard-delete-project' ? HardDeleteProjectSystemJobData :
        T extends 'project-usage-report' ? ProjectUsageReportSystemJobData :
            T extends 'usage-report' ? UsageReportSystemJobData :
                T extends 'trigger-data-cleaner' ? Record<string, never> :
                    T extends 'pieces-sync' ? Record<string, never> :
                        T extends 'pieces-analytics' ? Record<string, never> :
                            never

export type SystemJobDefinition<T extends SystemJobName> = {
    name: T
    data: SystemJobData<T>
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

export type JobSchedule =
    | OneTimeJobSchedule
    | RepeatedJobSchedule


type UpsertJobParams<T extends SystemJobName> = {
    job: SystemJobDefinition<T>
    schedule: JobSchedule
    handler: SystemJobHandler<T>
}


export type SystemJobSchedule = {
    init(): Promise<void>
    upsertJob<T extends SystemJobName>(params: UpsertJobParams<T>): Promise<void>
    close(): Promise<void>
}