import { apVersionUtil } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ExecutionType,
    ExecutioOutputFile,
    FileCompression,
    FileType,
    FlowOperationType,
    FlowStatus,
    isFlowRunStateTerminal,
    isNil,
    logSerializer,
    PiecePackage,
    Principal,
    PrincipalType,
    RunInternalError,
    StreamStepProgress,
    truncateFailedStepMessage,
    tryCatch,
    WebsocketClientEvent,
    WorkerToApiContract,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { aiUsageTrackerHooks } from '../../ai/ai-usage-tracker'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
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
import { knowledgeBaseService } from '../../knowledge-base/knowledge-base.service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { fieldService } from '../../tables/field/field.service'
import { recordService } from '../../tables/record/record.service'
import { tableService } from '../../tables/table/table.service'
import { dedupeService } from '../../trigger/dedupe-service'
import { triggerEventService } from '../../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun, webhookService } from '../../webhooks/webhook.service'
import { getWorkerGroupQueueName, QueueName, RunsMetadataUpsertData } from '../job'
import { jobBroker } from '../job-queue/job-broker'
import { machineService } from '../machine/machine-service'

const getPollQueueName = (workerGroupId?: string): string => {
    return workerGroupId ? getWorkerGroupQueueName(workerGroupId) : QueueName.WORKER_JOBS
}

export function createHandlers(log: FastifyBaseLogger, workerGroupId?: string): WorkerToApiContract {
    return {
        async poll(input) {
            log.info({ workerId: input.workerId, workerGroupId }, '[workerRpc#poll] Poll request received')
            await machineService(log).onConnection(input, workerGroupId)
            const workerVersion = input.workerProps.version
            const appVersion = apVersionUtil.getCurrentRelease()
            if (workerVersion !== appVersion) {
                log.warn({ workerId: input.workerId, workerVersion, appVersion }, '[workerRpc#poll] Withholding job — worker version does not match app; worker will idle until upgraded')
                return null
            }
            const pollQueueName = getPollQueueName(workerGroupId)
            const job = await jobBroker(log).poll(pollQueueName)
            if (job) {
                log.info({ workerId: input.workerId, jobId: job.jobId, jobType: job.jobData.jobType }, '[workerRpc#poll] Returning job to worker')
            }
            else {
                log.debug({ workerId: input.workerId }, '[workerRpc#poll] No job available, returning null')
            }
            return job
        },

        async completeJob(input) {
            log.info({ jobId: input.jobId, status: input.status }, '[workerRpc#completeJob] Job completed by worker')
            await jobBroker(log).completeJob(input)
        },

        async updateRunProgress(input) {
            websocketService.to(input.flowRun.projectId).emit(WebsocketClientEvent.UPDATE_RUN_PROGRESS, input)
        },

        async uploadRunLog(input) {
            const internalErrorEnabled = system.getEdition() !== ApEdition.CLOUD
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
            log.info({ flowId, projectId }, '[workerRpc#disableFlow] Flow disabled by worker request')
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

        async resolveAiProvider(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            return aiProviderService(log).getConfigOrThrow({ platformId: principal.platform.id, provider: input.provider })
        },

        async reportAiUsage(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            const { event } = input
            const dedupeKey = `ai_usage_reported_${event.idempotencyKey}`
            const alreadyReported = await distributedStore.get<boolean>(dedupeKey)
            if (alreadyReported) {
                return
            }
            await distributedStore.put(dedupeKey, true, AI_USAGE_DEDUPE_TTL_SECONDS)
            const { error } = await tryCatch(() => aiUsageTrackerHooks.get(log).track({
                platformId: principal.platform.id,
                projectId: principal.projectId,
                event,
            }))
            if (error) {
                await tryCatch(() => distributedStore.delete(dedupeKey))
                throw error
            }
        },

        async listKnowledgeChunks(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            return knowledgeBaseService(log).listChunks({
                projectId: principal.projectId,
                knowledgeBaseFileId: input.knowledgeBaseFileId,
                embedded: input.embedded,
            })
        },

        async storeKnowledgeChunks(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            await knowledgeBaseService(log).storeChunks({
                projectId: principal.projectId,
                knowledgeBaseFileId: input.knowledgeBaseFileId,
                chunks: input.chunks,
            })
        },

        async searchKnowledge(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            return knowledgeBaseService(log).search({
                projectId: principal.projectId,
                knowledgeBaseFileIds: input.knowledgeBaseFileIds,
                queryEmbedding: input.queryEmbedding,
                limit: input.limit,
                similarityThreshold: input.similarityThreshold,
            })
        },

        async getTableSchema(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            const table = await tableService.getOneOrThrow({ projectId: principal.projectId, id: input.tableId })
            const fields = await fieldService.getAll({ projectId: principal.projectId, tableId: input.tableId })
            return {
                id: table.id,
                name: table.name,
                fields: fields.map((field) => ({ id: field.id, name: field.name, type: field.type })),
            }
        },

        async listTableRecords(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            const page = await recordService.list({
                projectId: principal.projectId,
                tableId: input.tableId,
                filters: input.filters,
                limit: input.limit,
                cursorRequest: null,
            })
            return { records: page.data }
        },

        async listPopulatedFlows(input) {
            const principal = await verifyEngineToken({ log, engineToken: input.engineToken })
            return flowService(log).list({
                projectIds: [principal.projectId],
                limit: ENGINE_FLOW_LIST_LIMIT,
                cursorRequest: null,
                externalIds: input.externalIds,
            })
        },

        async invokeFlowTool(input) {
            await verifyEngineToken({ log, engineToken: input.engineToken })
            const response = await webhookService.handleWebhook({
                logger: log,
                flowId: input.flowId,
                async: input.async,
                saveSampleData: await triggerSourceService(log).existsByFlowId({ flowId: input.flowId, simulate: true }),
                flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                payload: input.inputs,
                execute: true,
                failParentOnFailure: false,
                data: () => Promise.resolve({ body: input.inputs, method: 'POST', headers: {}, queryParams: {} }),
            })
            return { status: response.status, body: response.body }
        },
    }
}

const AI_USAGE_DEDUPE_TTL_SECONDS = 24 * 60 * 60
const ENGINE_FLOW_LIST_LIMIT = 1000000

async function verifyEngineToken({ log, engineToken }: { log: FastifyBaseLogger, engineToken: string }): Promise<EnginePrincipalLike> {
    const principal: Principal = await accessTokenManager(log).verifyPrincipal(engineToken)
    if (principal.type !== PrincipalType.ENGINE) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: { message: 'AI delegation requires an engine token' },
        })
    }
    return principal
}

type EnginePrincipalLike = Extract<Principal, { type: PrincipalType.ENGINE }>

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
        log.error({ error, logsFileId, projectId }, '[workerRpc#uploadRunLog] Failed to persist internal error to logs file')
    }
}

type PersistInternalErrorParams = {
    log: FastifyBaseLogger
    projectId: string
    logsFileId: string
    internalError: RunInternalError
}
