import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { JobType, LATEST_JOB_DATA_SCHEMA_VERSION, OneTimeJobData, QueueName, RepeatableJobType, ScheduledJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { DelayPauseMetadata, Flow, FlowRun, FlowRunStatus, isNil, PauseType, ProgressUpdateType, RunEnvironment, TriggerType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { triggerUtils } from '../../flows/trigger/hooks/trigger-utils'
import { QueueManager } from '../queue/queue-manager'
import { ApMemoryQueue } from './ap-memory-queue'

export const memoryQueues = {
    [QueueName.ONE_TIME]: new ApMemoryQueue<OneTimeJobData>(),
    [QueueName.SCHEDULED]: new ApMemoryQueue<ScheduledJobData>(),
    [QueueName.WEBHOOK]: new ApMemoryQueue<WebhookJobData>(),
    [QueueName.USERS_INTERACTION]: new ApMemoryQueue<UserInteractionJobData>(),
}

export const memoryQueue = (log: FastifyBaseLogger): QueueManager => ({
    async removeRepeatingJob({ flowVersionId }) {
        await memoryQueues[QueueName.SCHEDULED].remove(flowVersionId)
    },
    async init(): Promise<void> {
        await renewWebhooks(log)
        await renewEnabledRepeating(log)
        await addDelayedRun(log)
    },
    async add(params) {
        const { type, data } = params
        switch (type) {
            case JobType.ONE_TIME: {
                memoryQueues[QueueName.ONE_TIME].add({
                    id: params.id,
                    data,
                })
                break
            }
            case JobType.REPEATING: {
                memoryQueues[QueueName.SCHEDULED].add({
                    id: nanoid(),
                    data,
                    cronExpression: params.scheduleOptions.cronExpression,
                    cronTimezone: params.scheduleOptions.timezone,
                    failureCount: params.scheduleOptions.failureCount,
                })
                break
            }
            case JobType.DELAYED: {
                memoryQueues[QueueName.SCHEDULED].add({
                    id: params.id,
                    data,
                    nextFireAtEpochSeconds: dayjs().add(params.delay, 'ms').unix(),
                })
                break
            }
            case JobType.USERS_INTERACTION: {
                memoryQueues[QueueName.USERS_INTERACTION].add({
                    id: params.id,
                    data,
                })
                break
            }
            case JobType.WEBHOOK: {
                memoryQueues[QueueName.WEBHOOK].add({
                    id: params.id,
                    data,
                })
                break
            }
        }
    },
})

type FlowWithRenewWebhook = {
    flow: Flow
    scheduleOptions: {
        cronExpression: string
        timezone: string
    }
}

async function addDelayedRun(log: FastifyBaseLogger): Promise<void> {
    const flowRuns = await flowRunRepo().findBy({
        status: FlowRunStatus.PAUSED,
    })
    flowRuns.forEach((flowRun: FlowRun) => {
        if (flowRun.pauseMetadata?.type === PauseType.DELAY) {
            const delayPauseMetadata = flowRun.pauseMetadata as DelayPauseMetadata
            const delay = Math.max(
                0,
                dayjs(delayPauseMetadata.resumeDateTime).diff(dayjs(), 'ms'),
            )

            memoryQueue(log).add({
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
            }).catch((e) => log.error(e, '[MemoryQueue#init] add'))
        }
    })
}

async function renewEnabledRepeating(log: FastifyBaseLogger): Promise<void> {
    const enabledFlows = await flowService(log).getAllEnabled()
    const enabledRepeatingFlows = enabledFlows.filter((flow) => flow.schedule)
    enabledRepeatingFlows.forEach((flow) => {
        memoryQueue(log).add({
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
                failureCount: flow.schedule!.failureCount ?? 0,
            },
        }).catch((e) => log.error(e, '[MemoryQueue#init] add'))
    })
}

async function renewWebhooks(log: FastifyBaseLogger): Promise<void> {
    const enabledFlows = await flowService(log).getAllEnabled()
    const enabledRenewWebhookFlows = (
        await Promise.all(
            enabledFlows.map(async (flow) => {
                const flowVersion = await flowVersionService(log).getOneOrThrow(
                    flow.publishedVersionId!,
                )
                const trigger = flowVersion.trigger

                if (trigger.type !== TriggerType.PIECE) {
                    return null
                }

                const piece = await triggerUtils(log).getPieceTrigger({
                    trigger,
                    projectId: flow.projectId,
                })

                if (isNil(piece)) {
                    log.warn({
                        trigger,
                        flowId: flow.id,
                    },
                    'Piece not found for trigger',
                    )
                    return null
                }

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
        memoryQueue(log).add({
            id: flow.id,
            type: JobType.REPEATING,
            data: {
                projectId: flow.projectId,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                flowVersionId: flow.publishedVersionId!,
                flowId: flow.id,
                jobType: RepeatableJobType.RENEW_WEBHOOK,
            },
            scheduleOptions: {
                ...scheduleOptions,
                failureCount: 0,
            },
        }).catch((e) => log.error(e, '[MemoryQueue#init] add'))
    })
}