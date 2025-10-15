import {
    QueueName,
} from '@activepieces/server-shared'
import { AgentJobData, ApId, ExecuteFlowJobData, isNil, JobData, PollingJobData, RenewWebhookJobData, RunEnvironment, ScheduleOptions, UserInteractionJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'

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
type OneTimeJobAddParams = BaseAddParams<ExecuteFlowJobData | WebhookJobData | UserInteractionJobData | AgentJobData, JobType.ONE_TIME>

export type AddJobParams<type extends JobType> = type extends JobType.REPEATING ? RepeatingJobAddParams : OneTimeJobAddParams

export type QueueManager = {
    init(): Promise<void>
    add<JT extends JobType>(params: AddJobParams<JT>): Promise<void>
    removeRepeatingJob(params: RemoveParams): Promise<void>
}

