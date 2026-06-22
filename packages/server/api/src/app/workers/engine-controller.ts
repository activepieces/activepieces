
import { FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { createHandlers } from './rpc/worker-rpc-service'

export const flowEngineWorker: FastifyPluginAsyncZod = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/populated-flows', GetAllFlowsByProjectParams, async (request) => {
        return flowService(request.log).list({
            projectIds: [request.principal.projectId],
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

    app.get('/flows', GetLockedVersionRequest, async (request) => {
        const flowVersion = await flowVersionService(request.log).getOneOrThrow(request.query.versionId)
        await flowService(request.log).getOneOrThrow({
            id: flowVersion.flowId,
            projectId: request.principal.projectId,
        })
        return flowVersion
    })

    // The engine reports run progress/logs/response straight to the API as the ENGINE
    // principal. These mirror the worker socket-RPC handlers (createHandlers) one-to-one
    // so both paths share the exact same logic.
    app.post('/run-progress', EngineRunProgressRequest, async (request, reply) => {
        await createHandlers(request.log).updateRunProgress(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/run-logs', EngineRunLogsRequest, async (request, reply) => {
        await createHandlers(request.log).uploadRunLog(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/flow-response', EngineFlowResponseRequest, async (request, reply) => {
        await createHandlers(request.log).sendFlowResponse(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/step-progress', EngineStepProgressRequest, async (request, reply) => {
        await createHandlers(request.log).updateStepProgress(request.body)
        return reply.status(StatusCodes.OK).send()
    })

}


const GetAllFlowsByProjectParams = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        querystring: ListFlowsRequest.omit({ projectId: true }),
    },
}

const GetLockedVersionRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        querystring: GetFlowVersionForWorkerRequest,
        response: {
            [StatusCodes.OK]: FlowVersion,
        },
    },
}

const EngineRunProgressRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: UpdateRunProgressRequest,
    },
}

const EngineRunLogsRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: UploadRunLogsRequest,
    },
}

const EngineFlowResponseRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: SendFlowResponseRequest,
    },
}

const EngineStepProgressRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: UpdateStepProgressRequest,
    },
}
