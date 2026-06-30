
import { FileType, FlowVersion, GetFlowVersionForWorkerRequest, ListFlowsRequest, PrincipalType, SendFlowResponseRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { engineRunCallbackService } from '../flows/flow-run/engine-run-callback-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { pieceBundle } from '../pieces/piece-bundle'

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

    // The pool downloads this with the engine token in the Authorization header (Bearer) and follows
    // the redirect. The engine token is platform-scoped, which scopes custom-piece resolution.
    app.get('/pieces/bundle', PieceBundleRequest, async (request, reply) => {
        if (request.principal.type !== PrincipalType.ENGINE) {
            return reply.status(StatusCodes.UNAUTHORIZED).send()
        }
        const resolution = await pieceBundle(request.log).resolve({
            name: request.query.name,
            version: request.query.version,
            archiveId: request.query.archiveId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
        if (resolution.type === 'not-found') {
            return reply.status(StatusCodes.NOT_FOUND).send()
        }
        if (resolution.type === 'redirect') {
            return reply.status(StatusCodes.TEMPORARY_REDIRECT).header('Location', resolution.url).send()
        }
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId: resolution.archiveId,
            projectId: undefined,
            type: FileType.PACKAGE_ARCHIVE,
        })
        return reply
            .status(StatusCodes.OK)
            .header('Content-Type', 'application/octet-stream')
            .send(data)
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

const PieceBundleRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        querystring: z.object({
            name: z.string().optional(),
            version: z.string().optional(),
            archiveId: z.string().optional(),
        }),
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