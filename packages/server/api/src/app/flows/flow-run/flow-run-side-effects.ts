import { isNil } from '@activepieces/shared'
import dayjs from 'dayjs'
import {
    ActivepiecesError,
    ErrorCode,
    ExecutionType,
    FlowRun,
    PauseType,
} from '@activepieces/shared'
import { flowQueue } from '../../workers/flow-worker/flow-queue'
import { logger } from 'server-shared'
import {
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
} from '../../workers/flow-worker/job-data'
import { JobType } from '../../workers/flow-worker/queues/queue'
import { notifications } from '../../helper/notifications'
import { HookType } from './flow-run-service'
import { flowRunHooks } from './flow-run-hooks'

type StartParams = {
    flowRun: FlowRun
    executionType: ExecutionType
    payload: unknown
    synchronousHandlerId?: string
    hookType?: HookType
}

type PauseParams = {
    flowRun: FlowRun
}

const calculateDelayForResumeJob = (
    resumeDateTimeIsoString: string,
): number => {
    const now = dayjs()
    const resumeDateTime = dayjs(resumeDateTimeIsoString)
    const delayInMilliSeconds = resumeDateTime.diff(now)
    const resumeDateTimeAlreadyPassed = delayInMilliSeconds < 0

    if (resumeDateTimeAlreadyPassed) {
        return 0
    }

    return delayInMilliSeconds
}

export const flowRunSideEffects = {
    async finish({ flowRun }: { flowRun: FlowRun }): Promise<void> {
        await flowRunHooks
            .getHooks()
            .onFinish({ projectId: flowRun.projectId, tasks: flowRun.tasks! })

        await notifications.notifyRun({
            flowRun,
        })
    },
    async start({
        flowRun,
        executionType,
        payload,
        synchronousHandlerId,
        hookType,
    }: StartParams): Promise<void> {
        logger.info(
            `[FlowRunSideEffects#start] flowRunId=${flowRun.id} executionType=${executionType}`,
        )

        await flowQueue.add({
            id: flowRun.id,
            type: JobType.ONE_TIME,
            priority: isNil(synchronousHandlerId) ? 'medium' : 'high',
            data: {
                synchronousHandlerId,
                projectId: flowRun.projectId,
                environment: flowRun.environment,
                runId: flowRun.id,
                flowVersionId: flowRun.flowVersionId,
                payload,
                executionType,
                hookType,
            },
        })
    },

    async pause({ flowRun }: PauseParams): Promise<void> {
        logger.info(
            `[FlowRunSideEffects#pause] flowRunId=${flowRun.id} pauseType=${flowRun.pauseMetadata?.type}`,
        )

        const { pauseMetadata } = flowRun

        if (isNil(pauseMetadata)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `pauseMetadata is undefined flowRunId=${flowRun.id}`,
                },
            })
        }

        switch (pauseMetadata.type) {
            case PauseType.DELAY:
                await flowQueue.add({
                    id: flowRun.id,
                    type: JobType.DELAYED,
                    data: {
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        runId: flowRun.id,
                        projectId: flowRun.projectId,
                        environment: flowRun.environment,
                        jobType: RepeatableJobType.DELAYED_FLOW,
                        flowVersionId: flowRun.flowVersionId,
                    },
                    delay: calculateDelayForResumeJob(pauseMetadata.resumeDateTime),
                })
                break
            case PauseType.WEBHOOK:
                break
        }
    },
}
