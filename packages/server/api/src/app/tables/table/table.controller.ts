import { CreateTableRequest, ImportTableRequest, PrincipalType, Table } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { tableService } from './table.service'

export const tablesController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request, reply) => {
        const response = await tableService.create({
            projectId: request.principal.projectId,
            request: request.body,
        })
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.get('/', GetTablesRequest, async (request, reply) => {
        const response = await tableService.getAll({
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.delete('/:id', DeleteRequest, async (request, reply) => {
        await tableService.delete({
            projectId: request.principal.projectId,
            id: request.params.id,
        })
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id', GetTableByIdRequest, async (request, reply) => {
        const response = await tableService.getById({
            projectId: request.principal.projectId,
            id: request.params.id,
        })

        if (!response) {
            await reply.status(StatusCodes.NOT_FOUND).send('Table not found')
            return
        }
        
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.post('/:id/import', ImportRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send('Not implemented')
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
        response: {
            [StatusCodes.OK]: Table,
            [StatusCodes.NOT_FOUND]: Type.String(),
        },
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
