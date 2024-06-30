import dayjs from 'dayjs'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { triggerUtils } from '../../flows/trigger/hooks/trigger-utils'
import { QueueManager } from '../queue/queue-manager'
import { ApMemoryQueue } from './ap-memory-queue'
import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { JobType, LATEST_JOB_DATA_SCHEMA_VERSION, logger, OneTimeJobData, QueueName, RepeatableJobType, ScheduledJobData, WebhookJobData } from '@activepieces/server-shared'
import { DelayPauseMetadata, Flow, FlowRunStatus, PauseType, ProgressUpdateType, RunEnvironment, TriggerType } from '@activepieces/shared'

export const memoryQueues = {
    [QueueName.ONE_TIME]: new ApMemoryQueue<OneTimeJobData>(),
    [QueueName.SCHEDULED]: new ApMemoryQueue<ScheduledJobData>(),
    [QueueName.WEBHOOK]: new ApMemoryQueue<WebhookJobData>(),
}

export const memoryQueue: QueueManager = {
    async removeRepeatingJob({ id }) {
        await memoryQueues[QueueName.SCHEDULED].remove(id)
    },
    async init(): Promise<void> {
        await renewWebhooks()
        await renewEnabledRepeating()
        await addDelayedRun()
    },
    async add(params) {
        const { type, data, id } = params
        switch (type) {
            case JobType.ONE_TIME: {
                memoryQueues[QueueName.ONE_TIME].add({
                    id,
                    data,
                })
                break
            }
            case JobType.REPEATING: {
                memoryQueues[QueueName.SCHEDULED].add({
                    data,
                    id,
                    cronExpression: params.scheduleOptions.cronExpression,
                    cronTimezone: params.scheduleOptions.timezone,
                })
                break
            }
            case JobType.DELAYED: {
                memoryQueues[QueueName.SCHEDULED].add({
                    id,
                    data,
                    nextFireAtEpochSeconds: dayjs().add(params.delay, 'ms').unix(),
                })
                break
            }
            case JobType.WEBHOOK: {
                memoryQueues[QueueName.WEBHOOK].add({
                    id,
                    data,
                })
                break
            }
        }
    },
}

type FlowWithRenewWebhook = {
    flow: Flow
    scheduleOptions: {
        cronExpression: string
        timezone: string
    }
}

async function addDelayedRun(): Promise<void> {
    const flowRuns = await flowRunRepo.findBy({
        status: FlowRunStatus.PAUSED,
    })
    flowRuns.forEach((flowRun) => {
        if (flowRun.pauseMetadata?.type === PauseType.DELAY) {
            const delayPauseMetadata = flowRun.pauseMetadata as DelayPauseMetadata
            const delay = Math.max(
                0,
                dayjs(delayPauseMetadata.resumeDateTime).diff(dayjs(), 'ms'),
            )

            memoryQueue.add({
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
}

async function renewEnabledRepeating(): Promise<void> {
    const enabledFlows = await flowService.getAllEnabled()
    const enabledRepeatingFlows = enabledFlows.filter((flow) => flow.schedule)
    enabledRepeatingFlows.forEach((flow) => {
        memoryQueue.add({
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
}

async function renewWebhooks(): Promise<void> {
    const enabledFlows = await flowService.getAllEnabled()
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

                const piece = await triggerUtils.getPieceTriggerOrThrow({
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
    enabledRenewWebhookFlows.forEach(({ flow, scheduleOptions }) => {
        memoryQueue.add({
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
}