
import { FileCompression, FileType, FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { fileService } from '../file/file.service'
import { stepFileService } from '../file/step-file/step-file.service'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { projectService } from '../project/project-service'

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

    app.get('/files/:fileId', GetEnginePayloadFileRequest, async (request, reply) => {
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId: request.params.fileId,
            projectId: request.principal.projectId,
        })
        return reply
            .type('application/octet-stream')
            .status(StatusCodes.OK)
            .send(data)
    })

    app.post('/files/log-slice', UploadFlowRunLogSliceRequest, async (request, reply) => {
        const data = request.body as Buffer
        const file = await fileService(request.log).save({
            projectId: request.principal.projectId,
            data,
            size: data.length,
            type: FileType.FLOW_RUN_LOG_SLICE,
            compression: FileCompression.ZSTD,
            metadata: {
                projectId: request.principal.projectId,
            },
        })
        const platformId = await projectService(request.log).getPlatformId(request.principal.projectId)
        const url = await stepFileService(request.log).signedUrlFor({
            platformId,
            fileId: file.id,
            fileType: FileType.FLOW_RUN_LOG_SLICE,
        })
        return reply.status(StatusCodes.OK).send({ fileId: file.id, url })
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

const GetEnginePayloadFileRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: z.object({
            fileId: z.string(),
        }),
    },
}

const UploadFlowRunLogSliceRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: z.unknown(),
    },
}