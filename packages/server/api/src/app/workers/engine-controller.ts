import { apAxios, GetRunForWorkerRequest } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, CreateTriggerRunRequestBody, EngineHttpResponse, FileType, FlowRunResponse, FlowRunStatus, GetFlowVersionForWorkerRequest, isNil, ListFlowsRequest, PauseType, PopulatedFlow, PrincipalType, ProgressUpdateType, SendFlowResponseRequest, UpdateLogsBehavior, UpdateRunProgressRequest, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { stepRunProgressHandler } from '../flows/flow-run/step-run-progress.handler'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { triggerRunService } from '../trigger/trigger-run/trigger-run.service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from './engine-response-watcher'

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
        return flowRunService(request.log).getOnePopulatedOrThrow({
            id: runId,
            projectId: request.principal.projectId,
        })
    })

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
        const { runId, workerHandlerId, runDetails, httpRequestId, executionStateContentLength, updateLogsBehavior, executionStateBuffer, failedStepName: failedStepName, logsFileId, testSingleStepMode } = request.body
        const progressUpdateType = request.body.progressUpdateType ?? ProgressUpdateType.NONE

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(runDetails.status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await engineResponseWatcher(request.log).publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(runDetails),
            )
        }

        const runWithoutSteps = await flowRunService(request.log).updateRun({
            flowRunId: runId,
            status: runDetails.status,
            tasks: runDetails.tasks,
            duration: runDetails.duration,
            projectId: request.principal.projectId,
            tags: runDetails.tags ?? [],
            failedStepName,
            logsFileId,
        })

        switch (updateLogsBehavior) {
            case UpdateLogsBehavior.UPDATE_LOGS: {
                assertNotNullOrUndefined(executionStateContentLength, 'executionStateContentLength is required')
                await flowRunService(request.log).updateLogs({
                    flowRunId: runId,
                    logsFileId: runWithoutSteps.logsFileId ?? undefined,
                    projectId: request.principal.projectId,
                    executionStateString: executionStateBuffer,
                    executionStateContentLength,
                })
                break
            }
            case UpdateLogsBehavior.UPDATE_LOGS_SIZE: {
                assertNotNullOrUndefined(executionStateContentLength, 'executionStateContentLength is required')
                await fileService(request.log).updateSize({
                    fileId: runWithoutSteps.logsFileId!,
                    size: executionStateContentLength,
                })
                break
            }
            case UpdateLogsBehavior.NONE: {
                break
            }
        }

        if (runDetails.status === FlowRunStatus.PAUSED) {
            await flowRunService(request.log).pause({
                flowRunId: runId,
                pauseMetadata: {
                    progressUpdateType,
                    handlerId: workerHandlerId ?? undefined,
                    ...(runDetails.pauseMetadata!),
                },
            })
        }
        const shouldMarkParentAsFailed = runWithoutSteps.failParentOnFailure && !isNil(runWithoutSteps.parentRunId) && ![FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED, FlowRunStatus.QUEUED].includes(runWithoutSteps.status)
        if (shouldMarkParentAsFailed) {
            await markParentRunAsFailed({
                parentRunId: runWithoutSteps.parentRunId!,
                childRunId: runWithoutSteps.id,
                projectId: request.principal.projectId,
                platformId: request.principal.platform.id,
                log: request.log,
            })
        }
        app.io.to(request.principal.projectId).emit(WebsocketClientEvent.FLOW_RUN_PROGRESS, {
            runId,
        })

        if (testSingleStepMode) {
            const response = await stepRunProgressHandler(request.log).extractStepResponse({
                runId,
            })
            if (!isNil(response)) {
                app.io.to(request.principal.projectId).emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
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

    app.post('/create-trigger-run', CreateTriggerRunParams, async (request) => {
        const { status, payload, flowId, simulate, jobId } = request.body
        const { projectId } = request.principal
        const trigger = await triggerSourceService(request.log).getByFlowId({
            flowId,
            projectId,
            simulate,
        })
        if (!isNil(trigger)) {
            await triggerRunService(request.log).create({
                status,
                payload,
                triggerSourceId: trigger.id,
                projectId,
                pieceName: trigger.pieceName,
                pieceVersion: trigger.pieceVersion,
                jobId,
            })
        }

    })


    app.get('/flows', GetLockedVersionRequest, async (request) => {
        const populatedFlow = await getFlow(request.principal.projectId, request.query, request.log)
        return {
            ...populatedFlow,
            version: await flowVersionService(request.log).lockPieceVersions({
                flowVersion: populatedFlow.version,
                projectId: request.principal.projectId,
            }),
        }
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

async function getFlow(projectId: string, request: GetFlowVersionForWorkerRequest, log: FastifyBaseLogger): Promise<PopulatedFlow> {
    // TODO this can be optimized by getting the flow version directly
    const flowVersion = await flowVersionService(log).getOneOrThrow(request.versionId)
    return flowService(log).getOnePopulatedOrThrow({
        id: flowVersion.flowId,
        projectId,
        versionId: request.versionId,
    })
}


async function markParentRunAsFailed({
    parentRunId,
    childRunId,
    projectId,
    platformId,
    log,
}: MarkParentRunAsFailedParams): Promise<void> {
    const flowRun = await flowRunService(log).getOneOrThrow({
        id: parentRunId,
        projectId,
    })

    const requestId = flowRun.pauseMetadata?.type === PauseType.WEBHOOK ? flowRun.pauseMetadata?.requestId : undefined
    assertNotNullOrUndefined(requestId, 'Parent run has no request id')

    const callbackUrl = await domainHelper.getPublicApiUrl({ path: `/v1/flow-runs/${parentRunId}/requests/${requestId}`, platformId })
    const childRunUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/runs/${childRunId}`, platformId })
    await apAxios.post(callbackUrl, {
        status: 'error',
        data: {
            message: 'Subflow execution failed',
            link: childRunUrl,
        },
    })
}

type MarkParentRunAsFailedParams = {
    parentRunId: string
    childRunId: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
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
            [StatusCodes.OK]: PopulatedFlow,
        },
    },
}

const CreateTriggerRunParams = {

    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: CreateTriggerRunRequestBody,
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
