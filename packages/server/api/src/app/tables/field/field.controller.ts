import { CreateFieldRequest, Field, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { fieldService } from './field.service'

export const fieldController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/:id/fields', CreateRequest, async (request, reply) => {
        const response = await fieldService.create({
            tableId: request.params.id,
            request: request.body,
        })
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.get('/:id/fields/:fieldId', GetFieldByIdRequest, async (request, reply) => {
        const response = await fieldService.getById({
            tableId: request.params.id,
            id: request.params.fieldId,
        })

        if (!response) {
            await reply.status(StatusCodes.NOT_FOUND).send('Field not found')
            return
        }

        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.delete('/:id/fields/:fieldId', DeleteFieldRequest, async (request) => {
        return fieldService.delete({
            tableId: request.params.id,
            id: request.params.fieldId,
        })
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
        params: Type.Object({
            id: Type.String(),
        }),
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
        response: {
            [StatusCodes.OK]: Field,
            [StatusCodes.NOT_FOUND]: Type.String(),
        },
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
