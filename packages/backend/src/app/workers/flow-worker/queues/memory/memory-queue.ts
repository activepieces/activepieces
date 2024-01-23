import dayjs from 'dayjs'
import {
    AddParams,
    DelayedJobAddParams,
    JobType,
    OneTimeJobAddParams,
    QueueManager,
    RemoveParams,
    RepeatingJobAddParams,
} from '../queue'
import cronParser from 'cron-parser'
import { logger } from '../../../../helper/logger'
import { DelayPauseMetadata, ExecutionOutputStatus, ExecutionType, PauseType, RunEnvironment, TriggerType } from '@activepieces/shared'
import { flowRunRepo } from '../../../../flows/flow-run/flow-run-service'
import { flowService } from '../../../../flows/flow/flow.service'

function calculateNextFireForCron(cronExpression: string, timezone: string): number | null {
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

type InMemoryQueueManager = {
    queues: {
        [JobType.ONE_TIME]: OneTimeJobAddParams[]
        [JobType.REPEATING]: (RepeatingJobAddParams & {
            nextFireEpochMsAt: number
        })[]
        [JobType.DELAYED]: (DelayedJobAddParams & { nextFireEpochSeconds: number })[]
    }
} & QueueManager

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

        logger.info(`Adding ${enabledRepeatingFlows.length} flows to the queue manager.`)

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
                    executionType: ExecutionType.BEGIN,
                },
                scheduleOptions: {
                    cronExpression: flow.schedule!.cronExpression,
                    timezone: flow.schedule!.timezone,
                },
            })
                .catch((e) => logger.error(e, '[MemoryQueue#init] add'))
        })

        const flowRuns = await flowRunRepo.findBy({
            status: ExecutionOutputStatus.PAUSED,
        })
        logger.info(`Adding ${flowRuns.length} flow runs to the queue manager.`)
        flowRuns.forEach((flowRun) => {
            if (flowRun.pauseMetadata?.type === PauseType.DELAY) {

                const delayPauseMetadata = flowRun.pauseMetadata as DelayPauseMetadata
                const delay = Math.max(0, dayjs(delayPauseMetadata.resumeDateTime).diff(dayjs(), 'ms'))

                this.add({
                    id: flowRun.id,
                    type: JobType.DELAYED,
                    data: {
                        runId: flowRun.id,
                        projectId: flowRun.projectId,
                        environment: RunEnvironment.PRODUCTION,
                        schemaVersion: 1,
                        flowVersionId: flowRun.flowVersionId,
                        executionType: ExecutionType.RESUME,
                    },
                    delay,
                })
                    .catch((e) => logger.error(e, '[MemoryQueue#init] add'))
            }
        })
        // TODO add run with status RUNNING
    },
    async add(params: AddParams): Promise<void> {
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
