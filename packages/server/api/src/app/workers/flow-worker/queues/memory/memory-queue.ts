import dayjs from 'dayjs'
import {
    AddParams,
    DelayedJobAddParams,
    JobType,
    OneTimeJobAddParams,
    QueueManager,
    RemoveParams,
    RenewWebhookJobAddParams,
    RepeatingJobAddParams,
} from '../queue'
import cronParser from 'cron-parser'
import { logger } from 'server-shared'
import {
    DelayPauseMetadata,
    Flow,
    FlowRunStatus,
    PauseType,
    RunEnvironment,
    TriggerType,
} from '@activepieces/shared'
import { flowRunRepo } from '../../../../flows/flow-run/flow-run-service'
import { flowService } from '../../../../flows/flow/flow.service'
import {
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
} from '../../job-data'
import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { flowVersionService } from '../../../../flows/flow-version/flow-version.service'
import { getPieceTrigger } from '../../../../flows/trigger/hooks/trigger-utils'

function calculateNextFireForCron(
    cronExpression: string,
    timezone: string,
): number | null {
    try {
        const options = {
            tz: timezone,
        }

        const interval = cronParser.parseExpression(cronExpression, options)
        const nextFireEpochMsAt = dayjs(interval.next().getTime()).unix()

        return nextFireEpochMsAt
    }
    catch (err) {
        logger.error(err)
        return null
    }
}

type RepeatableJob =
  | RepeatingJobAddParams<JobType.REPEATING>
  | RenewWebhookJobAddParams<JobType.REPEATING>

type InMemoryQueueManager = {
    queues: {
        [JobType.ONE_TIME]: OneTimeJobAddParams<JobType.ONE_TIME>[]
        [JobType.REPEATING]: (RepeatableJob & {
            nextFireEpochMsAt: number
        })[]
        [JobType.DELAYED]: (DelayedJobAddParams<JobType.DELAYED> & {
            nextFireEpochSeconds: number
        })[]
    }
} & QueueManager

type FlowWithRenewWebhook = {
    flow: Flow
    scheduleOptions: {
        cronExpression: string
        timezone: string
    }
}

export const inMemoryQueueManager: InMemoryQueueManager = {
    queues: {
        ONE_TIME: [],
        REPEATING: [],
        DELAYED: [],
    },

    async init(): Promise<void> {
        this.queues = {
            ONE_TIME: [],
            REPEATING: [],
            DELAYED: [],
        }
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
                    },
                    delay,
                }).catch((e) => logger.error(e, '[MemoryQueue#init] add'))
            }
        })
    // TODO add run with status RUNNING
    },
    async add(params: AddParams<JobType>): Promise<void> {
        switch (params.type) {
            case JobType.ONE_TIME: {
                this.queues[params.type].push(params)
                break
            }
            case JobType.REPEATING: {
                const nextFireEpochMsAt = calculateNextFireForCron(
                    params.scheduleOptions.cronExpression,
                    params.scheduleOptions.timezone,
                )
                if (nextFireEpochMsAt) {
                    this.queues[params.type].push({
                        ...params,
                        nextFireEpochMsAt,
                    })
                }
                break
            }
            case JobType.DELAYED: {
                this.queues[params.type].push({
                    ...params,
                    nextFireEpochSeconds: dayjs().add(params.delay, 'ms').unix(),
                })
                break
            }
        }
    },

    async removeRepeatingJob(params: RemoveParams): Promise<void> {
        this.queues.REPEATING = this.queues.REPEATING.filter(
            (job) => job.id !== params.id,
        )
    },
}
