import {
    QueueName,
} from '@activepieces/server-shared'
import { AgentJobData, ApId, DelayedJobData, ExecuteFlowJobData, isNil, JobData, PollingJobData, RenewWebhookJobData, RunEnvironment, ScheduleOptions, UserInteractionJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'

export const JOB_PRIORITY = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    veryLow: 5,
    lowest: 6,
}



const TESTING_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'high'
const ASYNC_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'medium'
const SYNC_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'high'
export const RATE_LIMIT_PRIORITY: keyof typeof JOB_PRIORITY = 'lowest'

function getExecuteFlowPriority(environment: RunEnvironment, synchronousHandlerId: string | undefined | null): keyof typeof JOB_PRIORITY {
    switch (environment) {
        case RunEnvironment.TESTING:
            return TESTING_EXECUTE_FLOW_PRIORITY
        case RunEnvironment.PRODUCTION:
            return isNil(synchronousHandlerId) ? ASYNC_EXECUTE_FLOW_PRIORITY : SYNC_EXECUTE_FLOW_PRIORITY
    }
}

export function getDefaultJobPriority(job: JobData): keyof typeof JOB_PRIORITY {
    switch (job.jobType) {
        case WorkerJobType.EXECUTE_POLLING:
        case WorkerJobType.RENEW_WEBHOOK:
            return 'veryLow'
        case WorkerJobType.EXECUTE_WEBHOOK:
        case WorkerJobType.EXECUTE_AGENT:
            return 'medium'
        case WorkerJobType.DELAYED_FLOW:
        case WorkerJobType.EXECUTE_FLOW:
            return getExecuteFlowPriority(job.environment, job.synchronousHandlerId)
        case WorkerJobType.EXECUTE_TOOL:
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
            return 'critical'
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

