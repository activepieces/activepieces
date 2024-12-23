import { CreateTableRequest, PrincipalType, Table } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { tableService } from './table.service'

export const tablesController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request, reply) => {
        const response = await tableService.create({
            projectId: request.principal.projectId,
            request: request.body,
        })
        await reply.status(StatusCodes.CREATED).send(response)
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
        await reply.status(StatusCodes.NO_CONTENT).send()
    },
    )

    fastify.get('/:id', GetTableByIdRequest, async (request) => {
        return tableService.getById({
            projectId: request.principal.projectId,
            id: request.params.id,
        })
    },
    )
}

const CreateRequest =  {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        body: CreateTableRequest,
        response: {
            [StatusCodes.CREATED]: Table,
        },
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
        },
    },
}
