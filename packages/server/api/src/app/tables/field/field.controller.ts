import { CreateFieldRequest, Field, PlatformUsageMetric, PrincipalType, UpdateFieldRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { PlatformPlanHelper } from '../../ee/platform/platform-plan/platform-plan-helper'
import { fieldService } from './field.service'

export const fieldController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request, reply) => {
        await PlatformPlanHelper.checkResourceLocked({ resource: PlatformUsageMetric.TABLES, platformId: request.principal.platform.id })

        const response = await fieldService.create({ request: request.body, projectId: request.principal.projectId })
        await reply.status(StatusCodes.CREATED).send(response)
    },
    )

    fastify.get('/', GetFieldsRequest, async (request) => {
        return fieldService.getAll({
            projectId: request.principal.projectId,
            tableId: request.query.tableId,
        })
    },
    )

    fastify.get('/:id', GetFieldByIdRequest, (request) => {
        return fieldService.getById({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
    },
    )

    fastify.delete('/:id', DeleteFieldRequest, async (request) => {
        return fieldService.delete({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
    },
    )

    fastify.post('/:id', UpdateRequest, async (request) => {
        return fieldService.update({
            id: request.params.id,
            projectId: request.principal.projectId,
            request: request.body,
        })
    },
    )
}
const CreateRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        body: CreateFieldRequest,
    },
    response: {
        [StatusCodes.CREATED]: Field,
    },
}

const GetFieldByIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const DeleteFieldRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const GetFieldsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER, PrincipalType.WORKER],
    },
    schema: {
        querystring: Type.Object({
            tableId: Type.String(),
        }),
    },
}

const UpdateRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateFieldRequest,
    },
}
