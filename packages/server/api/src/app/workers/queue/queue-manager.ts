import { ApId, ExecuteFlowJobData, JobData, PollingJobData, RenewWebhookJobData, ScheduleOptions, UserInteractionJobData, WebhookJobData, OutgoingWebhookJobData } from '@activepieces/shared'


export enum JobType {
    REPEATING = 'repeating',
    ONE_TIME = 'one_time',
}

type BaseAddParams<JD extends Omit<JobData, 'engineToken'>, JT extends JobType> = {
    id: ApId
    data: JD
    type: JT
    delay?: number
    dependOnJobId?: ApId
}
type RepeatingJobAddParams = BaseAddParams<PollingJobData | RenewWebhookJobData, JobType.REPEATING> & {
    scheduleOptions: ScheduleOptions
}
type OneTimeJobAddParams = BaseAddParams<ExecuteFlowJobData | WebhookJobData | UserInteractionJobData | OutgoingWebhookJobData, JobType.ONE_TIME>

export type AddJobParams<type extends JobType> = type extends JobType.REPEATING ? RepeatingJobAddParams : OneTimeJobAddParams

