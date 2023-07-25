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
import { flowInstanceRepo } from '../../../../flows/flow-instance/flow-instance.service'
import { DelayPauseMetadata, ExecutionOutputStatus, ExecutionType, FlowInstanceStatus, PauseType, RunEnvironment, TriggerType } from '@activepieces/shared'
import { flowRunRepo } from '../../../../flows/flow-run/flow-run-service'

function calculateNextFireForCron(cronExpression: string, timezone: string) {
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
        const flowInstances = (await flowInstanceRepo.find({})).filter(
            (flowInstance) => flowInstance.schedule && flowInstance.status === FlowInstanceStatus.ENABLED,
        )
        logger.info(`Adding ${flowInstances.length} flow instances to the queue manager.`)
        flowInstances.forEach((flowInstance) => {
            this.add({
                id: flowInstance.id,
                type: JobType.REPEATING,
                data: {
                    projectId: flowInstance.projectId,
                    environment: RunEnvironment.PRODUCTION,
                    schemaVersion: 1,
                    flowVersionId: flowInstance.flowVersionId,
                    flowId: flowInstance.flowId,
                    triggerType: TriggerType.PIECE,
                    executionType: ExecutionType.BEGIN,
                },
                scheduleOptions: {
                    cronExpression: flowInstance.schedule!.cronExpression,
                    timezone: flowInstance.schedule!.timezone,
                },
            })
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
