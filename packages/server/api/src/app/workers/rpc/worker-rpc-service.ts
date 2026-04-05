import {
    ExecutionType,
    FileType,
    FlowOperationType,
    FlowStatus,
    isFlowRunStateTerminal,
    isNil,
    PauseMetadata,
    PiecePackage,
    ProgressUpdateType,
    spreadIfDefined,
    WebsocketClientEvent,
    WorkerToApiContract,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { distributedStore } from '../../database/redis-connections'
import { fileService } from '../../file/file.service'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo, flowRunService } from '../../flows/flow-run/flow-run-service'
import { runsMetadataQueue } from '../../flows/flow-run/flow-runs-queue'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { pubsub } from '../../helper/pubsub'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { dedupeService } from '../../trigger/dedupe-service'
import { triggerEventService } from '../../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { getPlatformQueueName, QueueName, redisMetadataKey, RunsMetadataUpsertData } from '../job'
import { jobBroker } from '../job-queue/job-broker'
import { machineService } from '../machine/machine-service'

const getPollQueueName = (platformIdForDedicatedWorker?: string, isCanaryWorker = false): string => {
    return isCanaryWorker
        ? QueueName.CANARY_JOBS
        : platformIdForDedicatedWorker
            ? getPlatformQueueName(platformIdForDedicatedWorker)
            : QueueName.WORKER_JOBS
}

export function createHandlers(log: FastifyBaseLogger, platformIdForDedicatedWorker?: string, isCanaryWorker = false): WorkerToApiContract {
    return {
        async poll(input) {
            log.info({ workerId: input.workerId, platformIdForDedicatedWorker, isCanaryWorker }, '[workerRpc#poll] Poll request received')
            await machineService(log).onConnection(input, platformIdForDedicatedWorker)
            const pollQueueName = getPollQueueName(platformIdForDedicatedWorker, isCanaryWorker)
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
            if (input.pauseMetadata) {
                const result = await flowRunRepo().update(input.runId, {
                    status: input.status,
                    ...spreadIfDefined('pauseMetadata', input.pauseMetadata as PauseMetadata),
                    // Also persist logsFileId so that a concurrent resume() call can build the
                    // correct RESUME job pointing at the right execution-state file.
                    ...spreadIfDefined('logsFileId', input.logsFileId),
                })
                if (!result.affected) {
                    // Run not yet in DB (PRODUCTION runs are created async via queue).
                    // Force-flush the run metadata from Redis to DB so resume works immediately.
                    const key = redisMetadataKey(input.runId)
                    const runMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(key)
                    if (!isNil(runMetadata) && Object.keys(runMetadata).length > 0) {
                        await flowRunRepo().save({
                            ...runMetadata,
                            status: input.status,
                            pauseMetadata: input.pauseMetadata as PauseMetadata,
                            logsFileId: input.logsFileId,
                        })
                    }
                }
            }
            const logData: RunsMetadataUpsertData = {
                id: input.runId,
                projectId: input.projectId,
                status: input.status,
                tags: input.tags,
                logsFileId: input.logsFileId,
                failedStep: input.failedStep,
                startTime: input.startTime,
                finishTime: input.finishTime,
                pauseMetadata: input.pauseMetadata,
                stepsCount: input.stepsCount,
                stepNameToTest: input.stepNameToTest,
            }
            await runsMetadataQueue(log).add(logData)

            if (input.stepResponse && input.progressUpdateType === ProgressUpdateType.TEST_FLOW) {
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
            const { flowVersionId, projectId, payloads, httpRequestId, progressUpdateType, environment, parentRunId, failParentOnFailure } = input

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
                        synchronousHandlerId: undefined,
                        executionType: ExecutionType.BEGIN,
                        progressUpdateType,
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
            return flowVersionService(log).lockPieceVersions({
                flowVersion,
                projectId: flow.projectId,
            })
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

        async getPayloadFile(input) {
            const { data } = await fileService(log).getDataOrThrow({
                fileId: input.fileId,
                projectId: input.projectId,
            })
            return data
        },

        async getPieceArchive(input) {
            const { data } = await fileService(log).getDataOrThrow({
                fileId: input.archiveId,
                type: FileType.PACKAGE_ARCHIVE,
            })
            return data
        },

        async getUsedPieces() {
            const redisKey = `usedPieces:${platformIdForDedicatedWorker ?? 'shared'}`
            const pieces = await distributedStore.get<PiecePackage[]>(redisKey)
            return pieces ?? []
        },

        async markPieceAsUsed(input) {
            const redisKey = `usedPieces:${platformIdForDedicatedWorker ?? 'shared'}`
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
    }
}
