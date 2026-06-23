
import { FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest, SendFlowResponseRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { engineRunCallbackService } from '../flows/flow-run/engine-run-callback-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'

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

    app.post('/run-progress', RunProgressRequest, async (request, reply) => {
        engineRunCallbackService(request.log).updateRunProgress({
            projectId: request.principal.projectId,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/step-progress', StepProgressRequest, async (request, reply) => {
        engineRunCallbackService(request.log).updateStepProgress({
            projectId: request.principal.projectId,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/run-logs', RunLogsRequest, async (request, reply) => {
        await engineRunCallbackService(request.log).uploadRunLog({
            projectId: request.principal.projectId,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/flow-response', FlowResponseRequest, async (request, reply) => {
        await engineRunCallbackService(request.log).sendFlowResponse({
            request: request.body,
        })
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

const RunProgressRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: z.unknown(),
    },
}

const StepProgressRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: UpdateStepProgressRequest,
    },
}

const RunLogsRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: UploadRunLogsRequest,
    },
}

const FlowResponseRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: SendFlowResponseRequest,
    },
}