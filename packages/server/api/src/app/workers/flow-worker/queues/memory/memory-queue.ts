
import dayjs from 'dayjs'
import { flowService } from '../../../../flows/flow/flow.service'
import { flowRunRepo } from '../../../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../../../flows/flow-version/flow-version.service'
import { getPieceTrigger } from '../../../../flows/trigger/hooks/trigger-utils'
import {
    AddParams,
    DelayedJobAddParams,
    JobType,
    OneTimeJobAddParams,
    QueueManager,
    RemoveParams,
    RenewWebhookJobAddParams,
    RepeatingJobAddParams,
    WebhookJobAddParams,
} from '../queue'
import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { logger } from '@activepieces/server-shared'
import {
    DelayPauseMetadata,
    Flow,
    FlowRunStatus,
    PauseType,
    ProgressUpdateType,
    RunEnvironment,
    TriggerType,
} from '@activepieces/shared'
import {
    ApMemoryQueue,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType } from 'server-worker'

type FlowWithRenewWebhook = {
    flow: Flow
    scheduleOptions: {
        cronExpression: string
        timezone: string
    }
}

type RepeatingJob = RepeatingJobAddParams<JobType.REPEATING> | RenewWebhookJobAddParams<JobType.REPEATING>

const oneTimeQueue: ApMemoryQueue<OneTimeJobAddParams<JobType.ONE_TIME>> = new ApMemoryQueue()
const repeatingQueue: ApMemoryQueue<RepeatingJob> = new ApMemoryQueue()
const delayedQueue: ApMemoryQueue<DelayedJobAddParams<JobType.DELAYED>> = new ApMemoryQueue()
const webhookQueue = new ApMemoryQueue<WebhookJobAddParams<JobType.WEBHOOK>>()

type MemoryQueueManager = QueueManager & {
    getOneTimeQueue(): ApMemoryQueue<OneTimeJobAddParams<JobType.ONE_TIME>>
    getRepeatingQueue(): ApMemoryQueue<RepeatingJob>
    getDelayedQueue(): ApMemoryQueue<DelayedJobAddParams<JobType.DELAYED>>
    getWebhookQueue(): ApMemoryQueue<WebhookJobAddParams<JobType.WEBHOOK>>
}

export const memoryQueueManager: MemoryQueueManager = {
    getOneTimeQueue: () => oneTimeQueue,
    getRepeatingQueue: () => repeatingQueue,
    getDelayedQueue: () => delayedQueue,
    getWebhookQueue: () => webhookQueue,
    async init(): Promise<void> {
        const enabledFlows = await flowService.getAllEnabled()
        const enabledRepeatingFlows = enabledFlows.filter((flow) => flow.schedule)
        const enabledRenewWebhookFlows = (
            await Promise.all(
                enabledFlows.map(async (flow) => {
                    const flowVersion = await flowVersionService.getOneOrThrow(
                        flow.publishedVersionId!,
                    )
                    const trigger = flowVersion.trigger

                    if (trigger.type !== TriggerType.PIECE) {
                        return null
                    }

                    const piece = await getPieceTrigger({
                        trigger,
                        projectId: flow.projectId,
                    })

                    const renewConfiguration = piece.renewConfiguration

                    if (renewConfiguration?.strategy !== WebhookRenewStrategy.CRON) {
                        return null
                    }

                    return {
                        scheduleOptions: {
                            cronExpression: renewConfiguration.cronExpression,
                            timezone: 'UTC',
                        },
                        flow,
                    }
                }),
            )
        ).filter((flow): flow is FlowWithRenewWebhook => flow !== null)

        logger.info(
            `Adding ${enabledRepeatingFlows.length} repeated flows to the queue manager.`,
        )
        logger.info(
            `Adding ${enabledRenewWebhookFlows.length} renew flows to the queue manager.`,
        )

        enabledRenewWebhookFlows.forEach(({ flow, scheduleOptions }) => {
            this.add({
                id: flow.id,
                type: JobType.REPEATING,
                data: {
                    projectId: flow.projectId,
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    flowVersionId: flow.publishedVersionId!,
                    flowId: flow.id,
                    jobType: RepeatableJobType.RENEW_WEBHOOK,
                },
                scheduleOptions,
            }).catch((e) => logger.error(e, '[MemoryQueue#init] add'))
        })
        enabledRepeatingFlows.forEach((flow) => {
            this.add({
                id: flow.id,
                type: JobType.REPEATING,
                data: {
                    projectId: flow.projectId,
                    environment: RunEnvironment.PRODUCTION,
                    schemaVersion: 1,
                    flowVersionId: flow.publishedVersionId!,
                    flowId: flow.id,
                    triggerType: TriggerType.PIECE,
                    jobType: RepeatableJobType.EXECUTE_TRIGGER,
                },
                scheduleOptions: {
                    cronExpression: flow.schedule!.cronExpression,
                    timezone: flow.schedule!.timezone,
                },
            }).catch((e) => logger.error(e, '[MemoryQueue#init] add'))
        })

        const flowRuns = await flowRunRepo.findBy({
            status: FlowRunStatus.PAUSED,
        })
        logger.info(`Adding ${flowRuns.length} flow runs to the queue manager.`)
        flowRuns.forEach((flowRun) => {
            if (flowRun.pauseMetadata?.type === PauseType.DELAY) {
                const delayPauseMetadata = flowRun.pauseMetadata as DelayPauseMetadata
                const delay = Math.max(
                    0,
                    dayjs(delayPauseMetadata.resumeDateTime).diff(dayjs(), 'ms'),
                )

                this.add({
                    id: flowRun.id,
                    type: JobType.DELAYED,
                    data: {
                        runId: flowRun.id,
                        projectId: flowRun.projectId,
                        environment: RunEnvironment.PRODUCTION,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        flowVersionId: flowRun.flowVersionId,
                        jobType: RepeatableJobType.DELAYED_FLOW,
                        synchronousHandlerId: delayPauseMetadata.handlerId ?? null,
                        progressUpdateType: delayPauseMetadata.progressUpdateType ?? ProgressUpdateType.NONE,
                    },
                    delay,
                }).catch((e) => logger.error(e, '[MemoryQueue#init] add'))
            }
        })
    },
    async add(params: AddParams<JobType>): Promise<void> {
        switch (params.type) {
            case JobType.ONE_TIME: {
                oneTimeQueue.add({
                    id: params.id,
                    data: params,
                })
                break
            }
            case JobType.REPEATING: {
                repeatingQueue.add({
                    data: params,
                    id: params.id,
                    cronExpression: params.scheduleOptions.cronExpression,
                    cronTimezone: params.scheduleOptions.timezone,
                })
                break
            }
            case JobType.DELAYED: {
                delayedQueue.add({
                    id: params.id,
                    data: params,
                    nextFireAtEpochSeconds: dayjs().add(params.delay, 'ms').unix(),
                })
                break
            }
            case JobType.WEBHOOK: {
                webhookQueue.add({
                    id: params.id,
                    data: params,
                })
                break
            }
        }
    },
    async removeRepeatingJob(params: RemoveParams): Promise<void> {
        repeatingQueue.remove(params.id)
    },
}
