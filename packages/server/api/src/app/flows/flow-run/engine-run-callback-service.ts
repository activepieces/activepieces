import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition, ExecutioOutputFile, FileCompression, FileType, isFlowRunStateTerminal, logSerializer, RunInternalError, RunInternalErrorSource, SendFlowResponseRequest, StreamStepProgress, truncateFailedStepMessage, UpdateStepProgressRequest, UploadRunLogsRequest, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { fileCompressor } from '../../file/file-compressor'
import { fileService } from '../../file/file.service'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { RunsMetadataUpsertData } from '../../workers/job'
import { runsMetadataQueue } from './flow-runs-queue'

export const engineRunCallbackService = (log: FastifyBaseLogger) => ({
    updateRunProgress({ projectId, request }: UpdateRunProgressParams): void {
        websocketService.to(projectId).emit(WebsocketClientEvent.UPDATE_RUN_PROGRESS, request)
    },

    updateStepProgress({ projectId, request }: UpdateStepProgressParams): void {
        websocketService.to(projectId).emit(WebsocketClientEvent.TEST_STEP_PROGRESS, { ...request, projectId })
    },

    async sendFlowResponse({ request }: SendFlowResponseParams): Promise<void> {
        await pubsub.publish(
            `engine-run:sync:${request.workerHandlerId}`,
            JSON.stringify({ requestId: request.httpRequestId, response: request.runResponse }),
        )
    },

    async uploadRunLog({ projectId, request }: UploadRunLogParams): Promise<void> {
        const internalErrorEnabled = request.internalError?.source === RunInternalErrorSource.ENGINE || system.getEdition() !== ApEdition.CLOUD
        const internalError = internalErrorEnabled ? request.internalError : undefined
        const isTerminal = isFlowRunStateTerminal({ status: request.status, ignoreInternalError: false })
        if (isTerminal && !isNil(request.logsFileId)) {
            await ensureLogsFileExists({
                log,
                projectId,
                logsFileId: request.logsFileId,
                internalError,
            })
        }
        const logData: RunsMetadataUpsertData = {
            id: request.runId,
            projectId,
            status: request.status,
            tags: request.tags,
            logsFileId: request.logsFileId,
            failedStep: truncateFailedStepMessage(request.failedStep),
            startTime: request.startTime,
            finishTime: request.finishTime,
            stepsCount: request.stepsCount,
            stepNameToTest: request.stepNameToTest,
        }
        await runsMetadataQueue(log).add(logData)

        if (request.stepResponse && request.streamStepProgress === StreamStepProgress.WEBSOCKET) {
            const stepData = { ...request.stepResponse, projectId }
            const isTerminalStatus = isFlowRunStateTerminal({
                status: request.status,
                ignoreInternalError: false,
            })
            if (!isTerminalStatus) {
                websocketService.to(projectId).emit(WebsocketClientEvent.TEST_STEP_PROGRESS, stepData)
            }
            else {
                websocketService.to(projectId).emit(WebsocketClientEvent.TEST_STEP_FINISHED, stepData)
            }
        }
    },
})

async function ensureLogsFileExists({ log, projectId, logsFileId, internalError }: EnsureLogsFileParams): Promise<void> {
    const { error } = await tryCatch(async () => {
        const fileExists = await fileService(log).exists({
            projectId,
            fileId: logsFileId,
            type: FileType.FLOW_RUN_LOG,
        })
        if (fileExists && isNil(internalError)) {
            return
        }

        const existing = fileExists
            ? await fileService(log).getDataOrUndefined({ projectId, fileId: logsFileId, type: FileType.FLOW_RUN_LOG })
            : undefined
        const outputFile: ExecutioOutputFile = !isNil(existing)
            ? JSON.parse(existing.data.toString('utf-8'))
            : { executionState: { steps: {}, tags: [] } }

        const data = await fileCompressor.compress({
            data: await logSerializer.serialize(isNil(internalError) ? outputFile : { ...outputFile, internalError }),
            compression: FileCompression.ZSTD,
        })

        const platformId = await projectService(log).getPlatformId(projectId)
        await fileService(log).save({
            fileId: logsFileId,
            projectId,
            platformId,
            type: FileType.FLOW_RUN_LOG,
            data,
            size: data.length,
            compression: FileCompression.ZSTD,
        })
    })

    if (error) {
        log.error({ error, logsFileId, project: { id: projectId } }, '[uploadRunLog] Failed to ensure logs file exists')
    }
}

type UpdateRunProgressParams = {
    projectId: string
    request: unknown
}

type UpdateStepProgressParams = {
    projectId: string
    request: UpdateStepProgressRequest
}

type SendFlowResponseParams = {
    request: SendFlowResponseRequest
}

type UploadRunLogParams = {
    projectId: string
    request: UploadRunLogsRequest
}

type EnsureLogsFileParams = {
    log: FastifyBaseLogger
    projectId: string
    logsFileId: string
    internalError?: RunInternalError
}
