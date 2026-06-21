import { isNil, tryCatch } from '@activepieces/core-utils'
import { apVersionUtil, onCallService, UNKNOWN_VERSION } from '@activepieces/server-utils'
import { ApEdition, ExecutionType, ExecutioOutputFile, FileCompression, FileType, FlowOperationType, FlowStatus, isFlowRunStateTerminal, logSerializer, PiecePackage, RunInternalError, RunInternalErrorSource, StreamStepProgress, truncateFailedStepMessage, WebsocketClientEvent, WorkerToApiContract } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { distributedStore } from '../../database/redis-connections'
import { chatRpcHandlers } from '../../ee/chat/chat-rpc-handlers'
import { fileCompressor } from '../../file/file-compressor'
import { fileService } from '../../file/file.service'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { runsMetadataQueue } from '../../flows/flow-run/flow-runs-queue'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { dedupeService } from '../../trigger/dedupe-service'
import { triggerEventService } from '../../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { getWorkerGroupQueueName, QueueName, RunsMetadataUpsertData } from '../job'
import { jobBroker } from '../job-queue/job-broker'
import { machineService } from '../machine/machine-service'

const getPollQueueName = (workerGroupId?: string): string => {
    return workerGroupId ? getWorkerGroupQueueName(workerGroupId) : QueueName.WORKER_JOBS
}

let pagedForUnreadableAppVersion = false

function pageOnceForUnreadableAppVersion(log: FastifyBaseLogger, appVersion: string): void {
    if (pagedForUnreadableAppVersion) {
        return
    }
    pagedForUnreadableAppVersion = true
    onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
        code: 'APP_VERSION_READ_FAILED',
        message: 'App could not read its release version from package.json (reported as 0.0.0); worker dispatch is gated and will NOT self-heal until the deployment is fixed (check cwd/packaging)',
        params: { appVersion },
    }).catch((pageError) => {
        log.error({ pageError }, '[workerRpc#poll] Failed to send on-call page for unreadable app version')
    })
}

export function createHandlers(log: FastifyBaseLogger, workerGroupId?: string): WorkerToApiContract {
    return {
        async poll(input) {
            log.info({ worker: { id: input.workerId }, workerGroupId }, '[workerRpc#poll] Poll request received')
            await machineService(log).onConnection(input, workerGroupId)
            const workerVersion = input.workerProps.version
            const appVersion = apVersionUtil.getCurrentRelease()
            if (!apVersionUtil.versionsAreCompatible({ versionA: workerVersion, versionB: appVersion })) {
                const versionUnreadable = workerVersion === UNKNOWN_VERSION || appVersion === UNKNOWN_VERSION
                if (versionUnreadable) {
                    log.error({ worker: { id: input.workerId }, workerVersion, appVersion }, '[workerRpc#poll] Withholding job — a release version could not be read from package.json (reported as 0.0.0); this will NOT self-heal on deploy completion, check the worker/app deployment (cwd/packaging)')
                }
                else {
                    log.warn({ worker: { id: input.workerId }, workerVersion, appVersion }, '[workerRpc#poll] Withholding job — worker version does not match app; worker will idle until upgraded')
                }
                if (appVersion === UNKNOWN_VERSION) {
                    pageOnceForUnreadableAppVersion(log, appVersion)
                }
                return null
            }
            const pollQueueName = getPollQueueName(workerGroupId)
            const job = await jobBroker(log).poll(pollQueueName)
            if (job) {
                log.info({ worker: { id: input.workerId }, job: { id: job.jobId, type: job.jobData.jobType } }, '[workerRpc#poll] Returning job to worker')
            }
            else {
                log.debug({ worker: { id: input.workerId } }, '[workerRpc#poll] No job available, returning null')
            }
            return job
        },

        async completeJob(input) {
            log.info({ job: { id: input.jobId }, status: input.status }, '[workerRpc#completeJob] Job completed by worker')
            await jobBroker(log).completeJob(input)
        },

        async updateRunProgress(input) {
            websocketService.to(input.flowRun.projectId).emit(WebsocketClientEvent.UPDATE_RUN_PROGRESS, input)
        },

        async uploadRunLog(input) {
            const internalErrorEnabled = input.internalError?.source === RunInternalErrorSource.ENGINE || system.getEdition() !== ApEdition.CLOUD
            if (internalErrorEnabled && !isNil(input.internalError) && !isNil(input.logsFileId)) {
                await persistInternalErrorToLogs({
                    log,
                    projectId: input.projectId,
                    logsFileId: input.logsFileId,
                    internalError: input.internalError,
                })
            }
            const logData: RunsMetadataUpsertData = {
                id: input.runId,
                projectId: input.projectId,
                status: input.status,
                tags: input.tags,
                logsFileId: input.logsFileId,
                failedStep: truncateFailedStepMessage(input.failedStep),
                startTime: input.startTime,
                finishTime: input.finishTime,
                stepsCount: input.stepsCount,
                stepNameToTest: input.stepNameToTest,
            }
            await runsMetadataQueue(log).add(logData)

            if (input.stepResponse && input.streamStepProgress === StreamStepProgress.WEBSOCKET) {
                const stepData = { ...input.stepResponse, projectId: input.projectId }
                const isTerminalStatus = isFlowRunStateTerminal({
                    status: input.status,
                    ignoreInternalError: false,
                })
                if (!isTerminalStatus) {
                    websocketService.to(input.projectId).emit(WebsocketClientEvent.TEST_STEP_PROGRESS, stepData)
                }
                else {
                    websocketService.to(input.projectId).emit(WebsocketClientEvent.TEST_STEP_FINISHED, stepData)
                }
            }
        },

        async sendFlowResponse(input) {
            await pubsub.publish(
                `engine-run:sync:${input.workerHandlerId}`,
                JSON.stringify({ requestId: input.httpRequestId, response: input.runResponse }),
            )
        },

        async updateStepProgress(input) {
            websocketService.to(input.projectId).emit(WebsocketClientEvent.TEST_STEP_PROGRESS, input)
        },

        async submitPayloads(input) {
            const { flowVersionId, projectId, payloads, httpRequestId, streamStepProgress, environment, parentRunId, failParentOnFailure } = input

            const flowVersion = await flowVersionService(log).getOne(flowVersionId)
            if (!flowVersion) {
                return []
            }

            const platformId = await projectService(log).getPlatformId(projectId)
            const filterPayloads = await dedupeService.filterUniquePayloads(flowVersionId, payloads)

            const flowRuns = await Promise.all(
                filterPayloads.map((payload) =>
                    flowRunService(log).start({
                        flowId: flowVersion.flowId,
                        environment,
                        flowVersionId,
                        payload,
                        projectId,
                        platformId,
                        httpRequestId,
                        workerHandlerId: undefined,
                        executionType: ExecutionType.BEGIN,
                        streamStepProgress,
                        executeTrigger: false,
                        parentRunId,
                        failParentOnFailure,
                    }),
                ),
            )
            return flowRuns
        },

        async savePayloads(input) {
            const { flowId, projectId, payloads } = input
            const savePayloads = payloads.map((payload) =>
                rejectedPromiseHandler(triggerEventService(log).saveEvent({
                    flowId,
                    payload,
                    projectId,
                }), log),
            )
            rejectedPromiseHandler(Promise.all(savePayloads), log)
            if (payloads.length > 0) {
                await triggerSourceService(log).disable({
                    flowId,
                    projectId,
                    simulate: true,
                    ignoreError: true,
                })
            }
        },

        async getFlowVersion(input) {
            const flowVersion = await flowVersionService(log).getOne(input.versionId)
            if (isNil(flowVersion)) {
                return null
            }
            const flow = await flowService(log).getOneById(flowVersion.flowId)
            if (isNil(flow)) {
                return null
            }
            return flowVersion
        },

        async getPiece(input) {
            return pieceMetadataService(log).get({
                name: input.name,
                version: input.version,
                projectId: input.projectId,
                platformId: input.platformId,
            })
        },

        async extendLock(input) {
            await jobBroker(log).extendLock(input)
        },

        async getPieceArchive(input) {
            const { data } = await fileService(log).getDataOrThrow({
                fileId: input.archiveId,
                type: FileType.PACKAGE_ARCHIVE,
            })
            return data
        },

        async getUsedPieces() {
            const redisKey = `usedPieces:${workerGroupId ?? 'shared'}`
            const pieces = await distributedStore.get<PiecePackage[]>(redisKey)
            return pieces ?? []
        },

        async markPieceAsUsed(input) {
            const redisKey = `usedPieces:${workerGroupId ?? 'shared'}`
            const existing = await distributedStore.get<PiecePackage[]>(redisKey) ?? []
            const existingKeys = new Set(existing.map((p) => `${p.pieceName}@${p.pieceVersion}`))
            const newPieces = input.pieces.filter((p) => !existingKeys.has(`${p.pieceName}@${p.pieceVersion}`))
            if (newPieces.length > 0) {
                await distributedStore.put(redisKey, [...existing, ...newPieces])
            }
        },

        async disableFlow(input) {
            const { flowId, projectId } = input
            const flow = await flowService(log).getOneOrThrow({ id: flowId, projectId })
            if (flow.status === FlowStatus.DISABLED) {
                return
            }
            const platformId = await projectService(log).getPlatformId(projectId)
            await flowService(log).update({
                id: flowId,
                userId: null,
                projectId,
                platformId,
                operation: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: { status: FlowStatus.DISABLED },
                },
            })
            log.info({ flow: { id: flowId }, project: { id: projectId } }, '[workerRpc#disableFlow] Flow disabled by worker request')
        },

        async sendChatEvent(input) {
            const { userId, conversationId, runId, event } = input
            websocketService.to(userId).emit(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, {
                conversationId,
                runId,
                ...event,
            })
        },

        async getChatConfig(input) {
            return chatRpcHandlers(log).getChatConfig(input)
        },

        async saveChatMessages(input) {
            return chatRpcHandlers(log).saveChatMessages(input)
        },

        async updateChatProgress(input) {
            return chatRpcHandlers(log).updateChatProgress(input)
        },

        async updateProjectContext(input) {
            return chatRpcHandlers(log).updateProjectContext(input)
        },

        async executeChatTool(input) {
            return chatRpcHandlers(log).executeChatTool(input)
        },
    }
}

async function persistInternalErrorToLogs({ log, projectId, logsFileId, internalError }: PersistInternalErrorParams): Promise<void> {
    const { error } = await tryCatch(async () => {
        const existing = await fileService(log).getDataOrUndefined({
            projectId,
            fileId: logsFileId,
            type: FileType.FLOW_RUN_LOG,
        })
        const outputFile: ExecutioOutputFile = !isNil(existing)
            ? JSON.parse(existing.data.toString('utf-8'))
            : { executionState: { steps: {}, tags: [] } }

        const data = await fileCompressor.compress({
            data: await logSerializer.serialize({ ...outputFile, internalError }),
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
        log.error({ error, logsFileId, project: { id: projectId } }, '[workerRpc#uploadRunLog] Failed to persist internal error to logs file')
    }
}

type PersistInternalErrorParams = {
    log: FastifyBaseLogger
    projectId: string
    logsFileId: string
    internalError: RunInternalError
}
