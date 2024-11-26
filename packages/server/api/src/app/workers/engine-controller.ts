import { GetRunForWorkerRequest, JobStatus, logger, QueueName, SharedSystemProp, system, UpdateFailureCountRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, assertNotNullOrUndefined, EngineHttpResponse, EnginePrincipal, ErrorCode, FileType, FlowId, FlowRunResponse, FlowRunStatus, FlowStatus, GetFlowVersionForWorkerRequest, GetFlowVersionForWorkerRequestType, isNil, NotifyFrontendRequest, PauseType, PopulatedFlow, PrincipalType, ProgressUpdateType, ProjectId, RemoveStableJobEngineRequest, UpdateRunProgressRequest, UpdateRunProgressResponse, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { tasksLimit } from '../ee/project-plan/tasks-limit'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { triggerHooks } from '../flows/trigger'
import { flowConsumer } from './consumer'
import { webhookResponseWatcher } from './helper/webhook-response-watcher'
import { flowQueue } from './queue'

export const flowEngineWorker: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/runs/:runId', {
        config: {
            allowedPrincipals: [PrincipalType.ENGINE],
        },
        schema: {
            params: GetRunForWorkerRequest,
        },
    }, async (request) => {
        const { runId } = request.params
        return flowRunService.getOnePopulatedOrThrow({
            id: runId,
            projectId: request.principal.projectId,
        })
    })

    app.get('/populated-flows', GetAllFlowsByProjectParams, async (request) => {
        return flowService.list({
            projectId: request.principal.projectId,
            limit: 1000000,
            cursorRequest: null,
            folderId: undefined,
            status: undefined,
            name: undefined,
        })
    })

    app.post('/update-job', {
        config: {
            allowedPrincipals: [PrincipalType.ENGINE],
        },
        schema: {
            body: UpdateJobRequest,
        },
    }, async (request) => {
        const environment = system.getOrThrow(SharedSystemProp.ENVIRONMENT)
        if (environment === ApEnvironment.TESTING) {
            return {}
        }
        const enginePrincipal = request.principal as unknown as EnginePrincipal
        assertNotNullOrUndefined(enginePrincipal.queueToken, 'queueToken')
        const { id } = request.principal
        const { queueName, status, message } = request.body
        await flowConsumer.update({ jobId: id, queueName, status, message: message ?? 'NO_MESSAGE_AVAILABLE', token: enginePrincipal.queueToken })
        return {}
    })

    app.post('/update-failure-count', UpdateFailureCount, async (request) => {
        const { flowId, projectId, success } = request.body
        await flowService.updateFailureCount({
            flowId,
            projectId,
            success,
        })
    })

    app.post('/notify-frontend', NotifyFrontendParams, async (request) => {
        const { runId } = request.body
        app.io.to(request.principal.projectId).emit(WebsocketClientEvent.FLOW_RUN_PROGRESS, runId)
    })

    app.post('/update-run', UpdateRunProgress, async (request) => {
        const { runId, workerHandlerId, runDetails, httpRequestId, executionStateBuffer, executionStateContentLength } = request.body
        const progressUpdateType = request.body.progressUpdateType ?? ProgressUpdateType.NONE
        await handleWebhookResponse(runDetails, progressUpdateType, workerHandlerId, httpRequestId)

        const runWithoutSteps = await flowRunService.updateStatus({
            flowRunId: runId,
            status: getTerminalStatus(runDetails.status),
            tasks: runDetails.tasks,
            duration: runDetails.duration,
            projectId: request.principal.projectId,
            tags: runDetails.tags ?? [],
        })
        let uploadUrl: string | undefined
        const updateLogs = !isNil(executionStateContentLength)
        if (updateLogs) {
            uploadUrl = await flowRunService.updateLogsAndReturnUploadUrl({
                flowRunId: runId,
                logsFileId: runWithoutSteps.logsFileId ?? undefined,
                projectId: request.principal.projectId,
                executionStateString: executionStateBuffer,
                executionStateContentLength,
            })
        }
        else {
            app.io.to(request.principal.projectId).emit(WebsocketClientEvent.FLOW_RUN_PROGRESS, runId)
        }

        if (runDetails.status === FlowRunStatus.PAUSED) {
            await flowRunService.pause({
                flowRunId: runId,
                pauseMetadata: {
                    progressUpdateType,
                    handlerId: workerHandlerId ?? undefined,
                    ...(runDetails.pauseMetadata!),
                },
            })
        }
        const projectId = request.principal.projectId
        await disableFlowIfQuotaExceeded(projectId, runWithoutSteps.flowId, runDetails.status)
        await markJobAsCompleted(runWithoutSteps.status, runWithoutSteps.id, request.principal as unknown as EnginePrincipal, runDetails.error)
        const response: UpdateRunProgressResponse = {
            uploadUrl,
        }
        return response
    })

    app.get('/check-task-limit', CheckTaskLimitParams, async (request) => {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return {}
        }
        const exceededLimit = await tasksLimit.exceededLimit({
            projectId: request.principal.projectId,
        })
        if (exceededLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'tasks',
                },
            })
        }
        return {}
    })

    app.get('/flows', GetLockedVersionRequest, async (request) => {
        const populatedFlow = await getFlow(request.principal.projectId, request.query)
        return {
            ...populatedFlow,
            version: await flowVersionService.lockPieceVersions({
                flowVersion: populatedFlow.version,
                projectId: request.principal.projectId,
            }),
        }
    })

    app.post('/remove-stale-job', RemoveFlowRequest, async (request) => {
        const { flowVersionId, flowId } = request.body
        const flow = isNil(flowId) ? null : await flowService.getOnePopulated({
            projectId: request.principal.projectId,
            versionId: flowVersionId,
            id: flowId,
        })
        if (isNil(flow)) {
            await flowQueue.removeRepeatingJob({
                flowVersionId,
            })
            return
        }
        await triggerHooks.disable({
            projectId: flow.projectId,
            flowVersion: flow.version,
            simulate: false,
            ignoreError: true,
        })
        return {}
    })

    app.get('/files/:fileId', GetFileRequestParams, async (request, reply) => {
        const { fileId } = request.params
        const { data } = await fileService.getDataOrThrow({
            fileId,
            type: FileType.PACKAGE_ARCHIVE,
        })
        return reply
            .type('application/zip')
            .status(StatusCodes.OK)
            .send(data)
    })



}

async function disableFlowIfQuotaExceeded(projectId: ProjectId, flowId: FlowId, status: FlowRunStatus): Promise<void> {
    if (status === FlowRunStatus.QUOTA_EXCEEDED) {
        logger.info({
            projectId,
            flowId,
        }, 'Disabling flow due to quota exceeded')
        await flowService.updateStatus({
            id: flowId,
            projectId,
            newStatus: FlowStatus.DISABLED,
        })
    }
}

async function handleWebhookResponse(runDetails: FlowRunResponse, progressUpdateType: ProgressUpdateType, workerHandlerId: string | null | undefined, httpRequestId: string | null | undefined): Promise<void> {
    if (runDetails.status !== FlowRunStatus.RUNNING && progressUpdateType === ProgressUpdateType.WEBHOOK_RESPONSE && workerHandlerId && httpRequestId) {
        await webhookResponseWatcher.publish(
            httpRequestId,
            workerHandlerId,
            await getFlowResponse(runDetails),
        )
    }
}
async function markJobAsCompleted(status: FlowRunStatus, jobId: string, enginePrincipal: EnginePrincipal, error: unknown): Promise<void> {
    switch (status) {
        case FlowRunStatus.FAILED:
        case FlowRunStatus.TIMEOUT:
        case FlowRunStatus.PAUSED:
        case FlowRunStatus.QUOTA_EXCEEDED:
        case FlowRunStatus.STOPPED:
        case FlowRunStatus.SUCCEEDED:
            await flowConsumer.update({ jobId, queueName: QueueName.ONE_TIME, status: JobStatus.COMPLETED, token: enginePrincipal.queueToken!, message: 'Flow succeeded' })
            break
        case FlowRunStatus.RUNNING:
            break
        case FlowRunStatus.INTERNAL_ERROR:
            await flowConsumer.update({ jobId, queueName: QueueName.ONE_TIME, status: JobStatus.FAILED, token: enginePrincipal.queueToken!, message: `Internal error reported by engine: ${JSON.stringify(error)}` })
    }
}

async function getFlow(projectId: string, request: GetFlowVersionForWorkerRequest): Promise<PopulatedFlow> {
    const { type } = request
    switch (type) {
        case GetFlowVersionForWorkerRequestType.LATEST: {
            return flowService.getOnePopulatedOrThrow({
                id: request.flowId,
                projectId,
            })
        }
        case GetFlowVersionForWorkerRequestType.EXACT: {
            // TODO this can be optimized
            const flowVersion = await flowVersionService.getOneOrThrow(request.versionId)
            return flowService.getOnePopulatedOrThrow({
                id: flowVersion.flowId,
                projectId,
                versionId: request.versionId,
            })
        }
        case GetFlowVersionForWorkerRequestType.LOCKED: {
            const rawFlow = await flowService.getOneOrThrow({
                id: request.flowId,
                projectId,
            })
            if (isNil(rawFlow.publishedVersionId)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityId: rawFlow.id,
                        message: 'Flow has no published version',
                    },
                })
            }
            return flowService.getOnePopulatedOrThrow({
                id: rawFlow.id,
                projectId,
                versionId: rawFlow.publishedVersionId,
            })

        }
    }
}




const getTerminalStatus = (
    status: FlowRunStatus,
): FlowRunStatus => {
    return status == FlowRunStatus.STOPPED
        ? FlowRunStatus.SUCCEEDED
        : status
}

async function getFlowResponse(
    result: FlowRunResponse,
): Promise<EngineHttpResponse> {
    switch (result.status) {
        case FlowRunStatus.PAUSED:
            if (result.pauseMetadata && result.pauseMetadata.type === PauseType.WEBHOOK) {
                return {
                    status: StatusCodes.OK,
                    body: result.pauseMetadata.response,
                    headers: {},
                }
            }
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        case FlowRunStatus.STOPPED:
            return {
                status: result.stopResponse?.status ?? StatusCodes.OK,
                body: result.stopResponse?.body,
                headers: result.stopResponse?.headers ?? {},
            }
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
        case FlowRunStatus.RUNNING:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.SUCCEEDED:
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
    }
}


const GetAllFlowsByProjectParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {},
}
const CheckTaskLimitParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {},
}
const GetFileRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        params: Type.Object({
            fileId: Type.String(),
        }),
    },
}

const NotifyFrontendParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: NotifyFrontendRequest,
    },
}

const UpdateRunProgress = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: UpdateRunProgressRequest,
    },
}

const UpdateFailureCount = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: UpdateFailureCountRequest,
    },
}

const GetLockedVersionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        querystring: GetFlowVersionForWorkerRequest,
        response: {
            [StatusCodes.OK]: PopulatedFlow,
        },
    },
}

const RemoveFlowRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: RemoveStableJobEngineRequest,
    },
}