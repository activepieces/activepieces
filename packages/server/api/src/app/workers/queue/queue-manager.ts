import {
    QueueName,
} from '@activepieces/server-shared'
import { AgentJobData, ApId, ExecuteFlowJobData, JobData, PollingJobData, RenewWebhookJobData, ScheduleOptions, UserInteractionJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'

export const JOB_PRIORITY = {
    high: 2,
    medium: 3,
    low: 4,
    ultraLow: 5,
}


export const RATE_LIMIT_PRIORITY: keyof typeof JOB_PRIORITY = 'ultraLow'

export function getDefaultJobPriority(job: JobData): keyof typeof JOB_PRIORITY {
    switch (job.jobType) {
        case WorkerJobType.EXECUTE_POLLING:
        case WorkerJobType.RENEW_WEBHOOK:
            return 'low'
        case WorkerJobType.EXECUTE_FLOW:
        case WorkerJobType.EXECUTE_WEBHOOK:
        case WorkerJobType.EXECUTE_AGENT:
            return 'medium'
        case WorkerJobType.EXECUTE_TOOL:
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
            return 'high'
    }
}

export enum JobType {
    REPEATING = 'repeating',
    ONE_TIME = 'one_time',
}

type RemoveParams = {
    flowVersionId: ApId
}

type BaseAddParams<JD extends JobData, JT extends JobType> = {
    id: ApId
    data: JD
    type: JT
    delay?: number
    priority?: keyof typeof JOB_PRIORITY
}
type RepeatingJobAddParams = BaseAddParams<PollingJobData | RenewWebhookJobData, JobType.REPEATING> & {
    scheduleOptions: ScheduleOptions
}
type OneTimeJobAddParams = BaseAddParams<ExecuteFlowJobData | WebhookJobData | DelayedJobData | UserInteractionJobData | AgentJobData, JobType.ONE_TIME>

export type AddJobParams<type extends JobType> = type extends JobType.REPEATING ? RepeatingJobAddParams : OneTimeJobAddParams

export type QueueManager = {
    setConcurrency(queueName: QueueName, concurrency: number): Promise<void>
    init(): Promise<void>
    add<JT extends JobType>(params: AddJobParams<JT>): Promise<void>
    removeRepeatingJob(params: RemoveParams): Promise<void>
}
