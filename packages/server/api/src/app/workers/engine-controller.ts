
import { FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
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