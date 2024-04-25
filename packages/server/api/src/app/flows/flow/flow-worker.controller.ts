import { PopulatedFlow, PrincipalType } from "@activepieces/shared"
import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import { flowService } from "./flow.service"
import { flowVersionService } from "../flow-version/flow-version.service"
import { entitiesMustBeOwnedByCurrentProject } from "../../authentication/authorization"
import { StatusCodes } from "http-status-codes"

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
            flowVersion: flowVersion,
            projectId: request.principal.projectId,
        })
        return {
            ...flow,
            version: lockedVersion,
        }
    },
    )
}

const GetLockedVersionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER]
    },
    schema: {
        querystring: Type.Object({
            versionId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: PopulatedFlow
        }
    },
}
