import { QueueMode, system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import {
    DelayedJobData,
    OneTimeJobData,
    RepeatingJobData,
    JobData,
} from '../job-data'
import { ApId, ScheduleOptions } from '@activepieces/shared'

export const queueMode = system.getOrThrow(SystemProp.QUEUE_MODE) as QueueMode

export type QueueManager = {
    init(): Promise<void>
    add(params: AddParams): Promise<void>
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

export type RepeatingJobAddParams = BaseAddParams<
JobType.REPEATING,
RepeatingJobData
> & {
    scheduleOptions: ScheduleOptions
}

export type DelayedJobAddParams = BaseAddParams<
JobType.DELAYED,
DelayedJobData
> & {
    delay: number
}

export type OneTimeJobAddParams = BaseAddParams<
JobType.ONE_TIME,
OneTimeJobData
> & {
    priority: 'high' | 'medium'
}

export type ScheduledJobAddParams = RepeatingJobAddParams | DelayedJobAddParams

export type AddParams = OneTimeJobAddParams | ScheduledJobAddParams

export type RemoveParams = {
    id: ApId
}
