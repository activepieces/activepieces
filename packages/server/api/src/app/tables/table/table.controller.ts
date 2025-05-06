import { GitPushOperationType } from '@activepieces/ee-shared'
import { ApId, CreateTableRequest, CreateTableWebhookRequest, ExportTableResponse, ListTablesRequest, Permission, PrincipalType, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, Table, UpdateTableRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { gitRepoService } from '../../ee/project-release/git-sync/git-sync.service'
import { tableService } from './table.service'

const DEFAULT_PAGE_SIZE = 10

export const tablesController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request) => {
        return tableService.create({
            projectId: request.principal.projectId,
            request: request.body,
        })
    },
    ),

 
    fastify.post('/:id', UpdateRequest, async (request) => {
        return tableService.update({
            projectId: request.principal.projectId,
            id: request.params.id,
            request: request.body,
        })
         
    })

    fastify.get('/', GetTablesRequest, async (request) => {
        return tableService.list({
            projectId: request.principal.projectId,
            cursor: request.query.cursor,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            name: request.query.name,
        })
    },
    )

    fastify.delete('/:id', DeleteRequest, async (request, reply) => {
        await gitRepoService(request.log).onDeleted({
            type: GitPushOperationType.DELETE_TABLE,
            id: request.params.id,
            userId: request.principal.id,
            projectId: request.principal.projectId,
            log: request.log,
        })
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
    schema: {
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List tables',
        querystring: ListTablesRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Table),
        },
    },
}

const DeleteRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
    },
    
    schema: {
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a table',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}

const GetTableByIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.READ_TABLE,
    },
    schema: {
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get a table by id',
        params: Type.Object({
            id: ApId,
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
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Export a table', 
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
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Create a table webhook',
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
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a table webhook',
        params: Type.Object({
            id: Type.String(),
            webhookId: Type.String(),
        }),
    },
}

const UpdateRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
    },
    schema: {
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update a table',
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateTableRequest,
    },
}

