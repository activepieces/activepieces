import { GitPushOperationType } from '@activepieces/ee-shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { ApId, CreateTableRequest, CreateTableWebhookRequest, ExportTableResponse, ListTablesRequest, Permission, PrincipalType, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, Table, UpdateTableRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { gitRepoService } from '../../ee/projects/project-release/git-sync/git-sync.service'
import { recordSideEffects } from '../record/record-side-effects'
import { recordService } from '../record/record.service'
import { TableEntity } from './table.entity'
import { tableService } from './table.service'

const DEFAULT_PAGE_SIZE = 10

export const tablesController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/', CreateRequest, async (request) => {
        return tableService.create({
            projectId: request.projectId,
            request: request.body,
        })
    })

    fastify.post('/:id', UpdateRequest, async (request) => {
        return tableService.update({
            projectId: request.projectId,
            id: request.params.id,
            request: request.body,
        })

    })

    fastify.get('/', GetTablesRequest, async (request) => {
        return tableService.list({
            projectId: request.projectId,
            cursor: request.query.cursor,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            name: request.query.name,
            externalIds: request.query.externalIds,
        })
    })

    fastify.delete('/:id', DeleteRequest, async (request, reply) => {
        const table = await tableService.getOneOrThrow({
            projectId: request.projectId,
            id: request.params.id,
        })
        await gitRepoService(request.log).onDeleted({
            type: GitPushOperationType.DELETE_TABLE,
            externalId: table.externalId,
            userId: request.principal.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            log: request.log,
        })
        await tableService.delete({
            projectId: request.projectId,
            id: request.params.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    },
    )

    fastify.get('/:id', GetTableByIdRequest, async (request) => {
        return tableService.getOneOrThrow({
            projectId: request.projectId,
            id: request.params.id,
        })
    },
    )

    fastify.get('/:id/export', ExportTableRequest, async (request) => {
        return tableService.exportTable({
            projectId: request.projectId,
            id: request.params.id,
        })
    })

    fastify.post('/:id/webhooks', CreateTableWebhook, async (request) => {
        return tableService.createWebhook({
            projectId: request.projectId,
            id: request.params.id,
            request: request.body,
        })
    })

    fastify.delete('/:id/webhooks/:webhookId', DeleteTableWebhook, async (request) => {
        return tableService.deleteWebhook({
            projectId: request.projectId,
            id: request.params.id,
            webhookId: request.params.webhookId,
        })
    })

    fastify.post('/:id/clear', ClearTableRequest, async (request, reply) => {
        const deletedRecords = await recordService.deleteAll({
            tableId: request.params.id,
            projectId: request.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
        await recordSideEffects(fastify.log).handleRecordsEvent({
            tableId: request.params.id,
            projectId: request.projectId,
            records: deletedRecords,
            logger: request.log,
            authorization: request.headers.authorization as string,
        }, 'deleted')
    })
}

const CreateRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.BODY,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.READ_TABLE, {
            type: ProjectResourceType.QUERY,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.READ_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.READ_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
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

const ClearTableRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
        }),
    },
    schema: {
        tags: ['tables'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Clear all records from a table',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}

