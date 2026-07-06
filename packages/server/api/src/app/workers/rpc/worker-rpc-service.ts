import { assertNotNullOrUndefined, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { apVersionUtil, onCallService, UNKNOWN_VERSION } from '@activepieces/server-utils'
import { ApEdition, ExecutionType, FileCompression, FileLocation, FileType, FlowOperationType, FlowStatus, FlowVersionState, PrewarmDataResponse, WebsocketClientEvent, WorkerGroupScope, WorkerToApiContract } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { websocketService } from '../../core/websockets.service'
import { chatRpcHandlers } from '../../ee/chat/chat-rpc-handlers'
import { workerGroupService } from '../../ee/platform/platform-plan/worker-group.service'
import { fileService, getLocationForFile } from '../../file/file.service'
import { s3Helper } from '../../file/s3-helper'
import { signedFileTransport } from '../../file/signed-file-transport'
import { flowService } from '../../flows/flow/flow.service'
import { engineRunCallbackService } from '../../flows/flow-run/engine-run-callback-service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import Paginator from '../../helper/pagination/paginator'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { projectWorkerGroupService } from '../../project/project-worker-group.service'
import { dedupeService } from '../../trigger/dedupe-service'
import { triggerEventService } from '../../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { getPlatformGroupQueueName, getProjectGroupQueueName, QueueName, WorkerGroupAssignment } from '../job'
import { jobBroker } from '../job-queue/job-broker'
import { machineService } from '../machine/machine-service'

const getPollQueueName = (assignment: WorkerGroupAssignment | null): string => {
    if (isNil(assignment)) {
        return QueueName.WORKER_JOBS
    }
    return assignment.scope === WorkerGroupScope.PROJECT
        ? getProjectGroupQueueName(assignment.id)
        : getPlatformGroupQueueName(assignment.id)
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

export function createHandlers(log: FastifyBaseLogger, assignment: WorkerGroupAssignment | null = null, connectionId?: string): WorkerToApiContract {
    return {
        async poll(input) {
            log.info({ worker: { id: input.workerId }, workerGroup: assignment ?? undefined }, '[workerRpc#poll] Poll request received')
            await machineService(log).onConnection(input, assignment)
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
            const pollQueueName = getPollQueueName(assignment)
            const job = await jobBroker(log).poll(pollQueueName, connectionId)
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

        async uploadRunLog(input) {
            await engineRunCallbackService(log).uploadRunLog({ projectId: input.projectId, request: input })
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

        async getPrewarmData(input) {
            const empty: PrewarmDataResponse = { flows: [], platformId: '', engineToken: '' }

            // Targeted prewarm (flowPublished): the flow is already known, so skip listing active flows
            // and just mint a token for its project.
            if (!isNil(input.flow)) {
                const platformId = await projectService(log).getPlatformId(input.flow.projectId)
                const engineToken = await accessTokenManager(log).generateEngineToken({ projectId: input.flow.projectId, platformId })
                return { flows: [input.flow], platformId, engineToken }
            }

            let projectIds: string[] | undefined = undefined
            let platformId: string | undefined = undefined

            // for cloud we only try to get flows for dedicated workers (with a worker group id). we can't do it for shared workers because they handle all users flows
            if (system.getEdition() === ApEdition.CLOUD) {
                if (isNil(input.workerGroupId)) { // shared cloud worker
                    return empty
                }
                if (input.projectWorker) { // get projects with given worker group id
                    projectIds = await projectWorkerGroupService(log).getWorkerGroupProjects({ workerGroupId: input.workerGroupId })
                    if (isNil(projectIds) || projectIds.length === 0) {
                        return empty
                    }
                    platformId = await projectService(log).getPlatformId(projectIds[0])
                }
                else {  // get platform with given worker group id
                    platformId = await workerGroupService(log).getWorkerGroupPlatformId({ workerGroupId: input.workerGroupId }) ?? undefined
                    if (isNil(platformId)) {
                        return empty
                    }
                }
            }
            else {
                const platform = await platformService(log).getOldestPlatform()
                if (isNil(platform)) {
                    return empty
                }
                platformId = platform.id
            }

            const baseListParams = {
                status: [FlowStatus.ENABLED],
                versionState: FlowVersionState.LOCKED,
                limit: Paginator.NO_LIMIT,
                includeTriggerSource: false,
            }

            const activeFlows = await flowService(log).list(
                !isNil(projectIds) ? { ...baseListParams, projectIds } : { ...baseListParams, platformId },
            )
            const flows = activeFlows.data.map((flow) => ({ id: flow.id, versionId: flow.version.id, projectId: flow.projectId }))
            const engineToken = await accessTokenManager(log).generateEngineToken({
                projectId: projectIds?.[0] ?? (await projectService(log).getProjectIdsByPlatform(platformId))[0],
                platformId,
            })
            return { flows, platformId, engineToken }
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

        async getFlowBundle(input) {
            // Two intentional lookups (not the redundant double-read): the metadata
            // read decides the transport, so S3-backed bundles never load their bytes
            // into app memory — the worker pulls them straight from S3 via a signed URL.
            const file = await fileService(log).getFile({
                fileId: input.flowVersionId,
                projectId: input.projectId,
                type: FileType.FLOW_BUNDLE,
            })
            if (isNil(file)) {
                return null
            }
            if (signedFileTransport.isEnabled(file)) {
                assertNotNullOrUndefined(file.s3Key, 's3Key')
                const url = await s3Helper(log).getS3SignedUrl(file.s3Key, file.fileName ?? file.id)
                return { kind: 'url', url }
            }
            const { data } = await fileService(log).getDataOrThrow({
                fileId: input.flowVersionId,
                projectId: input.projectId,
                type: FileType.FLOW_BUNDLE,
            })
            return { kind: 'inline', data }
        },

        async prepareFlowBundleUpload(input) {
            // Bundles are only worth persisting on S3-backed storage. On DB storage the
            // bundle would just bloat the database (and a null-data pre-save would throw),
            // so tell the worker to skip publishing and always build inline.
            if (getLocationForFile(FileType.FLOW_BUNDLE) !== FileLocation.S3) {
                return { kind: 'skip' }
            }
            // S3 without signed URLs: the worker streams the bytes back via uploadFlowBundle.
            if (!signedFileTransport.shouldRedirectForType(FileType.FLOW_BUNDLE)) {
                return { kind: 'inline' }
            }
            // Signed-PUT path: persist the row (data null) so the s3Key exists, then
            // hand back a signed PUT URL for a direct-to-S3 upload.
            const file = await fileService(log).save({
                fileId: input.flowVersionId,
                projectId: input.projectId,
                platformId: input.platformId,
                type: FileType.FLOW_BUNDLE,
                data: null,
                size: input.size,
                compression: FileCompression.NONE,
            })
            assertNotNullOrUndefined(file.s3Key, 's3Key')
            const url = await s3Helper(log).putS3SignedUrl({
                s3Key: file.s3Key,
                contentLength: input.size,
            })
            return { kind: 'url', url }
        },

        async uploadFlowBundle(input) {
            await fileService(log).save({
                fileId: input.flowVersionId,
                projectId: input.projectId,
                platformId: input.platformId,
                type: FileType.FLOW_BUNDLE,
                data: input.data,
                size: input.data.length,
                compression: FileCompression.NONE,
            })
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
            return chatRpcHandlers(chatRpcLog(log, input)).getChatConfig(input)
        },

        async saveChatMessages(input) {
            return chatRpcHandlers(chatRpcLog(log, input)).saveChatMessages(input)
        },

        async saveChatFile(input) {
            return chatRpcHandlers(chatRpcLog(log, input)).saveChatFile(input)
        },

        async updateChatProgress(input) {
            return chatRpcHandlers(chatRpcLog(log, input)).updateChatProgress(input)
        },

        async heartbeatChatConversation(input) {
            return chatRpcHandlers(chatRpcLog(log, input)).heartbeatChatConversation(input)
        },

        async updateProjectContext(input) {
            return chatRpcHandlers(chatRpcLog(log, input)).updateProjectContext(input)
        },

        async executeChatTool(input) {
            const runId = typeof input.toolInput.runId === 'string' ? input.toolInput.runId : undefined
            const conversationId = input.conversationId ?? (typeof input.toolInput.conversationId === 'string' ? input.toolInput.conversationId : undefined)
            return chatRpcHandlers(chatRpcLog(log, { conversationId, runId, platformId: input.platformId, userId: input.userId })).executeChatTool(input)
        },

        async sendChatEmail(input) {
            return chatRpcHandlers(chatRpcLog(log, { conversationId: input.conversationId, platformId: input.platformId, userId: input.userId })).sendChatEmail(input)
        },
    }
}

// Binds conversation/run/platform/user to the per-call logger so every chat RPC
// log line correlates with the worker turn and the analyze-logs timeline.
function chatRpcLog(log: FastifyBaseLogger, ids: { conversationId?: string, runId?: string, platformId?: string, userId?: string }): FastifyBaseLogger {
    return log.child({
        ...spreadIfDefined('conversation', isNil(ids.conversationId) ? undefined : { id: ids.conversationId }),
        ...spreadIfDefined('run', isNil(ids.runId) ? undefined : { id: ids.runId }),
        ...spreadIfDefined('platform', isNil(ids.platformId) ? undefined : { id: ids.platformId }),
        ...spreadIfDefined('user', isNil(ids.userId) ? undefined : { id: ids.userId }),
    })
}
