import {
    DelayedJobData, JobData,
    JobType,
    OneTimeJobData,
    RenewWebhookJobData,
    RepeatingJobData,
    system,
    WebhookJobData,
} from '@activepieces/server-shared'
import { ApEdition, ApId, isNil, ScheduleOptions } from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { projectService } from '../../project/project-service'

export const JOB_PRIORITY = {
    high: 2,
    medium: 3,
    low: 4,
}

export const ENTERPRISE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'high'
export const TEST_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'low'
export const SYNC_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'medium'
export const DEFAULT_PRIORITY: keyof typeof JOB_PRIORITY = 'low'

// TODO remove after adding rate limting per user
export async function getJobPriority(projectId: string, synchronousHandlerId: string | null | undefined): Promise<keyof typeof JOB_PRIORITY> {
    const platformId = await projectService.getPlatformId(projectId)
    const isCloudPlatform = flagService.isCloudPlatform(platformId)
    const edition = system.getEdition()
    if (!isCloudPlatform && edition === ApEdition.CLOUD) {
        return ENTERPRISE_FLOW_PRIORITY
    }
    if (!isNil(synchronousHandlerId)) {
        return SYNC_FLOW_PRIORITY
    }
    return DEFAULT_PRIORITY
}

export type QueueManager = {
    init(): Promise<void>
    add<JT extends JobType>(params: AddParams<JT>): Promise<void>
    removeRepeatingJob(params: RemoveParams): Promise<void>
}

type RemoveParams = {
    flowVersionId: ApId
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
    priority: keyof typeof JOB_PRIORITY
}

type OneTimeJobAddParams<JT extends JobType.ONE_TIME> = BaseAddParams<JT, OneTimeJobData> & {
    priority: keyof typeof JOB_PRIORITY
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

