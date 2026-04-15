
import { FlowOperationType, FlowTriggerType, FlowVersion, GetFlowVersionForWorkerRequest, isNil, ListFlowsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'

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

    app.post('/flows', CreateFlowFromEngineRequest, async (request, reply) => {
        const { displayName, triggerPieceName, triggerName } = request.body
        const projectId = request.principal.projectId

        const newFlow = await flowService(request.log).create({
            projectId,
            request: { displayName, projectId },
        })

        if (!isNil(triggerPieceName) && !isNil(triggerName)) {
            const platformId = request.principal.platform.id
            const pieceMetadata = await pieceMetadataService(request.log).getOrThrow({
                name: triggerPieceName,
                version: undefined,
                platformId,
            })
            const latestVersion = await flowVersionService(request.log).getFlowVersionOrThrow({
                flowId: newFlow.id,
                versionId: undefined,
            })
            const updatedVersion = await flowVersionService(request.log).applyOperation({
                flowVersion: latestVersion,
                projectId,
                userId: null,
                platformId,
                userOperation: {
                    type: FlowOperationType.UPDATE_TRIGGER,
                    request: {
                        name: latestVersion.trigger.name,
                        type: FlowTriggerType.PIECE,
                        displayName: 'Callable Flow',
                        valid: true,
                        settings: {
                            pieceName: triggerPieceName,
                            pieceVersion: pieceMetadata.version,
                            triggerName,
                            input: {},
                            propertySettings: {},
                        },
                    },
                },
            })
            return reply.status(StatusCodes.CREATED).send({
                ...newFlow,
                version: updatedVersion,
            })
        }

        return reply.status(StatusCodes.CREATED).send(newFlow)
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

const CreateFlowFromEngineRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: z.object({
            displayName: z.string(),
            triggerPieceName: z.string().optional(),
            triggerName: z.string().optional(),
        }),
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