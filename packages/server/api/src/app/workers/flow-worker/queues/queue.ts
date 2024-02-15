import { QueueMode, SystemProp, system } from 'server-shared'
import {
    DelayedJobData,
    OneTimeJobData,
    RepeatingJobData,
    JobData,
    RenewWebhookJobData,
} from '../job-data'
import { ApId, ScheduleOptions } from '@activepieces/shared'

export const queueMode = system.getOrThrow(SystemProp.QUEUE_MODE) as QueueMode

export type QueueManager = {
    init(): Promise<void>
    add<JT extends JobType>(params: AddParams<JT>): Promise<void>
    removeRepeatingJob(params: RemoveParams): Promise<void>
}

export enum JobType {
    ONE_TIME = 'ONE_TIME',
    REPEATING = 'REPEATING',
    DELAYED = 'DELAYED',
}

export type BaseAddParams<JT extends JobType, JD extends JobData> = {
    id: ApId
    type: JT
    data: JD
}

export type RepeatingJobAddParams<JT extends JobType.REPEATING> = BaseAddParams<
JT,
RepeatingJobData
> & {
    scheduleOptions: ScheduleOptions
}

export type RenewWebhookJobAddParams<JT extends JobType.REPEATING> =
  BaseAddParams<JT, RenewWebhookJobData> & {
      scheduleOptions: ScheduleOptions
  }

export type DelayedJobAddParams<JT extends JobType.DELAYED> = BaseAddParams<
JT,
DelayedJobData
> & {
    delay: number
}

export type OneTimeJobAddParams<JT extends JobType.ONE_TIME> = BaseAddParams<
JT,
OneTimeJobData
> & {
    priority: 'high' | 'medium'
}

export type AddParams<JT extends JobType> = JT extends JobType.ONE_TIME
    ? OneTimeJobAddParams<JT>
    : JT extends JobType.REPEATING
        ? RepeatingJobAddParams<JT> | RenewWebhookJobAddParams<JT>
        : JT extends JobType.DELAYED
            ? DelayedJobAddParams<JT>
            : never

export type RemoveParams = {
    id: ApId
}
