import { CreateFieldRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'

export const fieldController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/:id/fields', CreateRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id/fields/:fieldId', GetFieldByIdRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.delete('/:id/fields/:fieldId', DeleteFieldRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id/fields', GetFieldsRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
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
}

const GetFieldByIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            fieldId: Type.String(),
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
            fieldId: Type.String(),
        }),
    },
}

const GetFieldsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
