import {
    CreateRecordsRequest,
    DeleteRecordsRequest,
    ListRecordsRequest,
    Permission,
    PopulatedRecord,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    TableWebhookEventType,
    UpdateRecordRequest,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { recordService } from './record.service'

const DEFAULT_PAGE_SIZE = 10

export const recordController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/', CreateRequest, async (request, reply) => {
        const records = await recordService.create({
            request: request.body,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.CREATED).send(records)
        await sendRecordsWebhooks({
            tableId: request.body.tableId,
            projectId: request.principal.projectId,
            records,
            logger: request.log,
            authorization: request.headers.authorization as string,
            eventType: TableWebhookEventType.RECORD_CREATED,
        })
    })

    fastify.get('/:id', GetRecordByIdRequest, async (request) => {
        return recordService.getById({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
    })

    fastify.post('/:id', UpdateRequest, async (request, reply) => {
        const record = await recordService.update({
            id: request.params.id,
            request: request.body,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.OK).send(record)
        await recordService.triggerWebhooks({
            projectId: request.principal.projectId,
            tableId: request.body.tableId,
            eventType: TableWebhookEventType.RECORD_UPDATED,
            data: { record },
            logger: request.log,
            authorization: request.headers.authorization as string,
        })
    })

    fastify.delete('/', DeleteRecordRequest, async (request, reply) => {
        const deletedRecords = await recordService.delete({
            ids: request.body.ids,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
        await sendRecordsWebhooks({
            tableId: deletedRecords[0].tableId,
            projectId: request.principal.projectId,
            records: deletedRecords,
            logger: request.log,
            authorization: request.headers.authorization as string,
            eventType: TableWebhookEventType.RECORD_DELETED,
        })
    })

    fastify.get('/', ListRequest, async (request) => {
        return recordService.list({
            tableId: request.query.tableId,
            projectId: request.principal.projectId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            filters: request.query.filters ?? null,
        })
    })
}

const CreateRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.WRITE_TABLE,
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
        permission: Permission.READ_TABLE,
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


const sendRecordsWebhooks = async ({ tableId, projectId, records, logger, authorization, eventType }: { tableId: string, projectId: string, records: PopulatedRecord[], logger: FastifyBaseLogger, authorization: string, eventType: TableWebhookEventType })=>{
    const promises =  records.map((record)=>{
        return recordService.triggerWebhooks({
            projectId,
            tableId,
            eventType,
            data: { record },
            logger,
            authorization,
        })
    })
    await Promise.all(promises)
}