import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { EngineHttpResponse, webhookResponseWatcher } from '../../workers/flow-worker/webhook-response-watcher'
import { flowRunService } from '../flow-run/flow-run-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowService } from './flow.service'
import { ExecutionState, FlowRunResponse, FlowRunStatus, PauseType, PopulatedFlow, PrincipalType, ProgressUpdateType, StepOutput, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'

export const flowWorkerController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.get('/', GetLockedVersionRequest, async (request) => {
        const flowVersion = await flowVersionService.getOneOrThrow(request.query.versionId)
        // Check if the flow version is owned by the current project
        const flow = await flowService.getOneOrThrow({
            id: flowVersion.flowId,
            projectId: request.principal.projectId,
        })
        const lockedVersion = await flowVersionService.lockPieceVersions({
            flowVersion,
            projectId: request.principal.projectId,
        })
        return {
            ...flow,
            version: lockedVersion,
        }
    })

    fastify.post('/update-run', UpdateStepProgress, async (request) => {
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
        fastify.io.to(populatedRun.projectId).emit(WebsocketClientEvent.TEST_FLOW_RUN_PROGRESS, populatedRun)
        return {}
    })

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
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {
        body: UpdateRunProgressRequest,
    },
}

const GetLockedVersionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {
        querystring: Type.Object({
            versionId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: PopulatedFlow,
        },
    },
}
