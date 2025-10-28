
import { EngineHttpResponse, FileType, FlowRunResponse, FlowRunStatus, FlowVersion, GetFlowVersionForWorkerRequest, isFlowRunStateTerminal, isNil, ListFlowsRequest, PrincipalType, SendFlowResponseRequest, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { stepRunProgressHandler } from '../flows/flow-run/step-run-progress.handler'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { engineResponseWatcher } from './engine-response-watcher'

export const flowEngineWorker: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/populated-flows', GetAllFlowsByProjectParams, async (request) => {
        return flowService(request.log).list({
            projectId: request.principal.projectId,
            limit: request.query.limit ?? 1000000,
            cursorRequest: request.query.cursor ?? null,
            folderId: request.query.folderId,
            status: request.query.status,
            name: request.query.name,
            versionState: request.query.versionState,
            connectionExternalIds: request.query.connectionExternalIds,
            agentExternalIds: request.query.agentExternalIds,
            externalIds: request.query.externalIds,
        })
    })

    app.post('/update-run', UpdateRunProgress, async (request, reply) => {
        const { runId, workerHandlerId, runDetails, httpRequestId, failedStepName, stepNameToTest, logsFileId } = request.body

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(runDetails.status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await engineResponseWatcher(request.log).publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(runDetails),
            )
        }

        await flowRunService(request.log).updateRun({
            flowRunId: runId,
            status: runDetails.status,
            duration: runDetails.duration,
            projectId: request.principal.projectId,
            tags: runDetails.tags ?? [],
            failedStepName,
            logsFileId,
            pauseMetadata: 'pauseMetadata' in runDetails ? runDetails.pauseMetadata : undefined,
        })

        if (!isNil(stepNameToTest)) {
            const response = await stepRunProgressHandler(request.log).extractStepResponse({
                logsFileId: logsFileId ?? '',
                projectId: request.principal.projectId,
                status: runDetails.status,
                runId,
                stepNameToTest,
            })
            
            if (!isNil(response)) {
                const isTerminalOutput = isFlowRunStateTerminal({
                    status: runDetails.status,
                    ignoreInternalError: false,
                })

                const wsEvent = isTerminalOutput  ? WebsocketClientEvent.TEST_STEP_FINISHED : WebsocketClientEvent.TEST_STEP_PROGRESS
                app.io.to(request.principal.projectId).emit(wsEvent, response)
            }
        }
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post('/update-flow-response', UpdateFlowResponseParams, async (request) => {
        const { workerHandlerId, httpRequestId, runResponse } = request.body
        await engineResponseWatcher(request.log).publish(
            httpRequestId,
            workerHandlerId,
            runResponse,
        )
        return {}
    })

    app.get('/flows', GetLockedVersionRequest, async (request) => {
        const flowVersion = await flowVersionService(request.log).getOneOrThrow(request.query.versionId)
        await flowService(request.log).getOneOrThrow({
            id: flowVersion.flowId,
            projectId: request.principal.projectId,
        })
        return flowVersionService(request.log).lockPieceVersions({
            flowVersion,
            projectId: request.principal.projectId,
        })
    })

    app.get('/files/:fileId', GetFileRequestParams, async (request, reply) => {
        const { fileId } = request.params
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId,
            type: FileType.PACKAGE_ARCHIVE,
        })
        return reply
            .type('application/zip')
            .status(StatusCodes.OK)
            .send(data)
    })
}


async function getFlowResponse(
    result: FlowRunResponse,
): Promise<EngineHttpResponse> {
    switch (result.status) {
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        // Case that should be handled before
        default:
            throw new Error(`Unexpected flow run status: ${result.status}`)
    }
}


const GetAllFlowsByProjectParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        querystring: Type.Omit(ListFlowsRequest, ['projectId']),
    },
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


const UpdateRunProgress = {
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
            [StatusCodes.OK]: FlowVersion,
        },
    },
}


const UpdateFlowResponseParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: SendFlowResponseRequest,
    },
}