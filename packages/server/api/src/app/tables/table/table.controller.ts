import { ALL_PRINCIPAL_TYPES, CreateTableRequest, ImportTableRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'

export const tablesController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/', GetTablesRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.delete('/:id', DeleteRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id', GetTableByIdRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.post('/:id/import', ImportRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )
}

const CreateRequest =  {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: CreateTableRequest,
    },
}

const GetTablesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}

const DeleteRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const GetTableByIdRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const ImportRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: ImportTableRequest,
    },
}
