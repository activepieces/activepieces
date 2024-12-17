import { CreateTableRequest, ImportTableRequest, PrincipalType } from '@activepieces/shared'
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        body: CreateTableRequest,
    },
}

const GetTablesRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
}

const DeleteRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const GetTableByIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const ImportRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: ImportTableRequest,
    },
}
