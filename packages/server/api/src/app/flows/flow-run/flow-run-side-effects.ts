import dayjs from 'dayjs'
import { issuesService } from '../../ee/issues/issues-service'
import { flowQueue } from '../../workers/flow-worker/flow-queue'
import { JobType } from '../../workers/flow-worker/queues/queue'
import { flowRunHooks } from './flow-run-hooks'
import { logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    ExecutionType,
    FlowRun,
    isFailedState,
    isNil,
    PauseType,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import {
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RepeatableJobType,
} from 'server-worker'

type StartParams = {
    flowRun: FlowRun
    executionType: ExecutionType
    payload: unknown
    synchronousHandlerId?: string
    progressUpdateType: ProgressUpdateType
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
        if (flowRun.environment === RunEnvironment.PRODUCTION) {
            if (isFailedState(flowRun.status)) {
                await issuesService.add({
                    flowId: flowRun.flowId,
                    projectId: flowRun.projectId,
                })
            }
        }
    },
    async start({
        flowRun,
        executionType,
        payload,
        synchronousHandlerId,
        progressUpdateType,
    }: StartParams): Promise<void> {
        logger.info(
            `[FlowRunSideEffects#start] flowRunId=${flowRun.id} executionType=${executionType}`,
        )

        await flowQueue.add({
            id: flowRun.id,
            type: JobType.ONE_TIME,
            priority: isNil(synchronousHandlerId) ? 'medium' : 'high',
            data: {
                synchronousHandlerId: synchronousHandlerId ?? null,
                projectId: flowRun.projectId,
                environment: flowRun.environment,
                runId: flowRun.id,
                flowVersionId: flowRun.flowVersionId,
                payload,
                executionType,
                progressUpdateType,
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
                        synchronousHandlerId: flowRun.pauseMetadata?.handlerId ?? null,
                        progressUpdateType: flowRun.pauseMetadata?.progressUpdateType ?? ProgressUpdateType.NONE,
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
