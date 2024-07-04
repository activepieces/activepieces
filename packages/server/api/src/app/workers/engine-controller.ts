import { GetRunForWorkerRequest, logger, SharedSystemProp, system, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, ApEnvironment, EngineHttpResponse, ErrorCode, ExecutionState, FlowRunResponse, FlowRunStatus, FlowStatus, GetFlowVersionForWorkerRequest, GetFlowVersionForWorkerRequestType, isNil, PauseType, PopulatedFlow, PrincipalType, ProgressUpdateType, RemoveStableJobEngineRequest, StepOutput, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
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
        const { id } = request.principal
        const { queueName, status, message } = request.body
        await flowConsumer.update(null, { jobId: id, queueName, status, message: message ?? 'NO_MESSAGE_AVAILABLE' })
        return {}
    })

    app.post('/update-run', UpdateStepProgress, async (request) => {
        const { runId, workerHandlerId, runDetails, progressUpdateType, httpRequestId } = request.body
        if (progressUpdateType === ProgressUpdateType.WEBHOOK_RESPONSE && workerHandlerId && httpRequestId) {
            await webhookResponseWatcher.publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(runDetails),
            )
        }

        const populatedRun = await flowRunService.updateStatus({
            flowRunId: runId,
            status: getTerminalStatus(runDetails.status),
            tasks: runDetails.tasks,
            duration: runDetails.duration,
            executionState: getExecutionState(runDetails),
            projectId: request.principal.projectId,
            tags: runDetails.tags ?? [],
        })

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
        app.io.to(populatedRun.projectId).emit(WebsocketClientEvent.TEST_FLOW_RUN_PROGRESS, populatedRun)
        if (runDetails.status === FlowRunStatus.QUOTA_EXCEEDED) {
            logger.info({
                projectId: populatedRun.projectId,
                runId: populatedRun.id,
            }, 'Disabling flow due to quota exceeded')
            await flowService.updateStatus({
                id: populatedRun.flowId,
                projectId: populatedRun.projectId,
                newStatus: FlowStatus.DISABLED,
            })
        }
        return {}
    })

    app.get('/check-task-limit', CheckTaskLimitParams, async (request) => {
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

    app.post('/remove-stable-job', RemoveFlowRequest, async (request) => {
        const { flowVersionId, flowId } = request.body
        const flow = isNil(flowId) ? null : await flowService.getOnePopulated({
            projectId: request.principal.projectId,
            versionId: flowVersionId,
            id: flowId,
        })
        if (isNil(flow)) {
            await flowQueue.removeRepeatingJob(null, {
                id: flowVersionId,
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
        const file = await fileService.getOneOrThrow({
            fileId,
        })
        return reply
            .type('application/zip')
            .status(StatusCodes.OK)
            .send(file.data)
    })

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


function getExecutionState(flowRunResponse: FlowRunResponse): ExecutionState | null {
    if ([FlowRunStatus.TIMEOUT, FlowRunStatus.QUOTA_EXCEEDED, FlowRunStatus.INTERNAL_ERROR].includes(flowRunResponse.status)) {
        return null
    }
    return {
        steps: flowRunResponse.steps as Record<string, StepOutput>,
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

const UpdateStepProgress = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: UpdateRunProgressRequest,
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