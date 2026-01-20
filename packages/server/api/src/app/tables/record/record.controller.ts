import { EntitySourceType, ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    CreateRecordsRequest,
    DeleteRecordsRequest,
    ListRecordsRequest,
    Permission,
    PopulatedRecord,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateRecordRequest,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { TableEntity } from '../table/table.entity'
import { recordSideEffects } from './record-side-effects'
import { RecordEntity } from './record.entity'
import { recordService } from './record.service'

const DEFAULT_PAGE_SIZE = 10

export const recordController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/', CreateRequest, async (request, reply) => {
        const records = await recordService.create({
            request: request.body,
            projectId: request.projectId,
            logger: request.log,
        })
        await reply.status(StatusCodes.CREATED).send(records)
        await recordSideEffects(fastify.log).handleRecordsEvent({
            tableId: request.body.tableId,
            projectId: request.projectId,
            records,
            logger: request.log,
            authorization: request.headers.authorization as string,
        }, 'created')
    })

    fastify.get('/:id', GetRecordByIdRequest, async (request) => {
        return recordService.getById({
            id: request.params.id,
            projectId: request.projectId,
        })
    })

    fastify.post('/:id', UpdateRequest, async (request, reply) => {
        const record = await recordService.update({
            id: request.params.id,
            request: request.body,
            projectId: request.projectId,
        })
        await reply.status(StatusCodes.OK).send(record)
        await recordSideEffects(fastify.log).handleRecordsEvent({
            tableId: request.body.tableId,
            projectId: request.projectId,
            records: [record],
            logger: request.log,
            authorization: request.headers.authorization as string,
            agentUpdate: request.body.agentUpdate ?? false,
        }, 'updated')
    })

    fastify.delete('/', DeleteRecordRequest, async (request, reply) => {
        const deletedRecords = await recordService.delete({
            ids: request.body.ids,
            projectId: request.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
        await recordSideEffects(fastify.log).handleRecordsEvent({
            tableId: deletedRecords[0]?.tableId,
            projectId: request.projectId,
            records: deletedRecords,
            logger: request.log,
            authorization: request.headers.authorization as string,
        }, 'deleted')
    })

    fastify.get('/', ListRequest, async (request) => {
        return recordService.list({
            tableId: request.query.tableId,
            projectId: request.projectId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            filters: request.query.filters ?? null,
        })
    })
}

const CreateRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
            entitySourceType: EntitySourceType.BODY,
            lookup: {
                paramKey: 'tableId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        body: CreateRecordsRequest,
        response: {
            [StatusCodes.CREATED]: Type.Array(PopulatedRecord),
        },
    },
}

const GetRecordByIdRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: RecordEntity,
        }),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: PopulatedRecord,
            [StatusCodes.NOT_FOUND]: Type.String(),
        },
    },
}

const UpdateRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: RecordEntity,
        }),
    },
    schema: {
        tags: ['records'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update a record',
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateRecordRequest,
        response: {
            [StatusCodes.OK]: PopulatedRecord,
        },

    },
}

const DeleteRecordRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.WRITE_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
            entitySourceType: EntitySourceType.BODY,
            lookup: {
                paramKey: 'tableId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        tags: ['records'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete records',
        body: DeleteRecordsRequest,
        response: {
            [StatusCodes.OK]: Type.Array(PopulatedRecord),
        },
    },
}

const ListRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], Permission.READ_TABLE, {
            type: ProjectResourceType.TABLE,
            tableName: TableEntity,
            entitySourceType: EntitySourceType.QUERY,
            lookup: {
                paramKey: 'tableId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        querystring: ListRecordsRequest,
        tags: ['records'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List records',
        response: {
            [StatusCodes.OK]: SeekPage(PopulatedRecord),
        },
    },
}

