import {
    DelayedJobData, JobData,
    JobType,
    OneTimeJobData,
    QueueName,
    RenewWebhookJobData,
    RepeatingJobData,
    WebhookJobData,
} from '@activepieces/server-shared'
import { ApId, ScheduleOptions } from '@activepieces/shared'

export type QueueManager = {
    init(): Promise<void>
    add<JT extends JobType>(groupId: string | null, params: AddParams<JT>): Promise<void>
    removeRepeatingJob(groupId: string | null, params: RemoveParams): Promise<void>
}

export const queueHelper = {
    getQueueName: (groupId: string | null, queueName: QueueName): string => {
        return groupId ? `${groupId}:${queueName}` : queueName
    },
}

type RemoveParams = {
    id: ApId
}

type BaseAddParams<JT extends JobType, JD extends JobData> = {
    id: ApId
    type: JT
    data: JD
}

type RepeatingJobAddParams<JT extends JobType.REPEATING> = BaseAddParams<JT, RepeatingJobData> & {
    scheduleOptions: ScheduleOptions
}

type RenewWebhookJobAddParams<JT extends JobType.REPEATING> = BaseAddParams<JT, RenewWebhookJobData> & {
    scheduleOptions: ScheduleOptions
}

type DelayedJobAddParams<JT extends JobType.DELAYED> = BaseAddParams<JT, DelayedJobData> & {
    delay: number
}

type WebhookJobAddParams<JT extends JobType.WEBHOOK> = BaseAddParams<JT, WebhookJobData> & {
    priority: 'high' | 'medium'
}

type OneTimeJobAddParams<JT extends JobType.ONE_TIME> = BaseAddParams<JT, OneTimeJobData> & {
    priority: 'high' | 'medium'
}


export type AddParams<JT extends JobType> = JT extends JobType.ONE_TIME
    ? OneTimeJobAddParams<JT>
    : JT extends JobType.REPEATING
        ? RepeatingJobAddParams<JT> | RenewWebhookJobAddParams<JT>
        : JT extends JobType.DELAYED
            ? DelayedJobAddParams<JT>
            : JT extends JobType.WEBHOOK
                ? WebhookJobAddParams<JT>
                : never

