
import { FileType, FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'

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


const GetAllFlowsByProjectParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE] as const,
    },
    schema: {
        querystring: Type.Omit(ListFlowsRequest, ['projectId']),
    },
}

const GetFileRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE] as const,
    },
    schema: {
        params: Type.Object({
            fileId: Type.String(),
        }),
    },
}

const GetLockedVersionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE] as const,
    },
    schema: {
        querystring: GetFlowVersionForWorkerRequest,
        response: {
            [StatusCodes.OK]: FlowVersion,
        },
    },
}