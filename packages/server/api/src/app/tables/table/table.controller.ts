import { CreateTableRequest, CreateTableWebhookRequest, ExportTableResponse, Permission, PrincipalType, Table } from '@activepieces/shared'
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

    fastify.get('/:id/export', ExportTableRequest, async (request) => {
        return tableService.exportTable({
            projectId: request.principal.projectId,
            id: request.params.id,
        })
    })

    fastify.post('/:id/webhooks', CreateTableWebhook, async (request) => {
        return tableService.createWebhook({
            projectId: request.principal.projectId,
            id: request.params.id,
            request: request.body,
        })
    })

    fastify.delete('/:id/webhooks/:webhookId', DeleteTableWebhook, async (request) => {
        return tableService.deleteWebhook({
            projectId: request.principal.projectId,
            id: request.params.id,
            webhookId: request.params.webhookId,
        })
    })
}

const CreateRequest =  {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
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
        permission: Permission.READ_TABLE,
    },
}

const DeleteRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
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
        permission: Permission.READ_TABLE,
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

const ExportTableRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.READ_TABLE,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: ExportTableResponse,
        },
    },
}

const CreateTableWebhook = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: CreateTableWebhookRequest,
    },
}

const DeleteTableWebhook = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            webhookId: Type.String(),
        }),
    },
}
