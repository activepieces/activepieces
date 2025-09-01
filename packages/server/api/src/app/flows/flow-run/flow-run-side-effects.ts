import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, RepeatableJobType } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    ExecutionType,
    FileCompression,
    FileLocation,
    FileType,
    FlowRun,
    isFlowUserTerminalState,
    isNil,
    PauseType,
    ProgressUpdateType,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../file/file.service'
import { s3Helper } from '../../file/s3-helper'
import { eventsHooks } from '../../helper/application-events'
import { system } from '../../helper/system/system'
import { jobQueue } from '../../workers/queue'
import { JOB_PRIORITY } from '../../workers/queue/queue-manager'
import { flowRunHooks } from './flow-run-hooks'
import { flowRunRepo } from './flow-run-service'

type StartParams = {
    flowRun: FlowRun
    executionType: ExecutionType
    payload: unknown
    stepNameToTest: string | undefined
    executeTrigger: boolean
    priority: keyof typeof JOB_PRIORITY
    synchronousHandlerId: string | undefined
    progressUpdateType: ProgressUpdateType
    httpRequestId: string | undefined
    sampleData: Record<string, unknown> | undefined
}

type PauseParams = {
    flowRun: FlowRun
}

const FILE_STORAGE_LOCATION = system.get(AppSystemProp.FILE_STORAGE_LOCATION) as FileLocation
const USE_SIGNED_URL = (system.get(AppSystemProp.S3_USE_SIGNED_URLS) === 'true') && FILE_STORAGE_LOCATION === FileLocation.S3

const calculateDelayForPausedRun = (
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

export const flowRunSideEffects = (log: FastifyBaseLogger) => ({
    async finish(flowRun: FlowRun): Promise<void> {
        if (!isFlowUserTerminalState(flowRun.status)) {
            return
        }
        await flowRunHooks(log).onFinish(flowRun)
        eventsHooks.get(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            data: {
                flowRun,
            },
        })
    },
    async start({
        flowRun,
        executionType,
        payload,
        synchronousHandlerId,
        httpRequestId,
        priority,
        progressUpdateType,
        executeTrigger,
        stepNameToTest,
        sampleData,
    }: StartParams): Promise<void> {
        log.info({
            flowRunId: flowRun.id,
            executionType,
        }, '[FlowRunSideEffects#start]')
        let logsUploadUrl: string | undefined
        if (USE_SIGNED_URL) {
            logsUploadUrl = await createLogsUploadUrl({
                flowRunId: flowRun.id,
                projectId: flowRun.projectId,
            }, log)
        }

        await jobQueue(log).add({
            id: flowRun.id,
            type: JobType.ONE_TIME,
            priority,
            data: {
                synchronousHandlerId: synchronousHandlerId ?? null,
                projectId: flowRun.projectId,
                environment: flowRun.environment,
                runId: flowRun.id,
                flowVersionId: flowRun.flowVersionId,
                payload,
                executeTrigger,
                httpRequestId,
                executionType,
                progressUpdateType,
                stepNameToTest,
                sampleData,
                logsUploadUrl,
            },
        })
        eventsHooks.get(log).sendWorkerEvent(flowRun.projectId, {
            action: ApplicationEventName.FLOW_RUN_STARTED,
            data: {
                flowRun,
            },
        })
    },

    async pause({ flowRun }: PauseParams): Promise<void> {
        log.info(
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
            case PauseType.DELAY: {
                await jobQueue(log).add({
                    id: flowRun.id,
                    type: JobType.DELAYED,
                    data: {
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        runId: flowRun.id,
                        flowId: flowRun.flowId,
                        synchronousHandlerId: flowRun.pauseMetadata?.handlerId ?? null,
                        progressUpdateType: flowRun.pauseMetadata?.progressUpdateType ?? ProgressUpdateType.NONE,
                        projectId: flowRun.projectId,
                        environment: flowRun.environment,
                        jobType: RepeatableJobType.DELAYED_FLOW,
                        flowVersionId: flowRun.flowVersionId,
                    },
                    delay: calculateDelayForPausedRun(pauseMetadata.resumeDateTime),
                })
                break
            }
            case PauseType.WEBHOOK:
                break
        }
    },
})

const createLogsUploadUrl = async (params: CreateLogsUploadUrlParams, log: FastifyBaseLogger): Promise<string | undefined> => {
    const file = await fileService(log).save({
        fileId: params.flowRunId,
        projectId: params.projectId,
        data: null,
        size: 0,
        type: FileType.FLOW_RUN_LOG,
        compression: FileCompression.NONE,
        metadata: {
            flowRunId: params.flowRunId,
            projectId: params.projectId,
        },
    })
    await flowRunRepo().update(params.flowRunId, {
        logsFileId: file.id,
    })

    assertNotNullOrUndefined(file.s3Key, 's3Key')
    return s3Helper(log).putS3SignedUrl(file.s3Key)
}


type CreateLogsUploadUrlParams = {
    flowRunId: string
    projectId: string
}
