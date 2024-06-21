import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { EngineHttpResponse, webhookResponseWatcher } from './helper/webhook-response-watcher'
import { assertNotNullOrUndefined, DisableFlowByEngineRequest, ExecutionState, FlowRunResponse, FlowRunStatus, GetFlowVersionForWorkerRequest, GetFlowVersionForWorkerRequestType, isNil, PauseType, PopulatedFlow, PrincipalType, ProgressUpdateType, StepOutput, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
import { flowQueue } from './queue'
import { triggerHooks } from '../flows/trigger'

export const flowEngineWorker: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/update-run', UpdateStepProgress, async (request) => {
        const { runId, workerHandlerId, runDetails, progressUpdateType } = request.body
        if (progressUpdateType === ProgressUpdateType.WEBHOOK_RESPONSE && workerHandlerId) {
            await webhookResponseWatcher.publish(
                runId,
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

    app.post('/disable-flow', DisableFlowRequest, async (request) => {
        const { flowVersionId, projectId, flowId } = request.body
        const flow = isNil(flowId) ? null : await flowService.getOnePopulated({
            projectId,
            versionId: flowVersionId,
            id: flowId,
        })
        if (isNil(flow)) {
            await flowQueue.removeRepeatingJob({
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
            // TODO this can be optmized
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
            assertNotNullOrUndefined(rawFlow.publishedVersionId, 'Flow has no published version')
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

const DisableFlowRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: DisableFlowByEngineRequest
    }
}