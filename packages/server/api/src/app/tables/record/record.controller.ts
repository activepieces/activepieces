import {
    CreateRecordsRequest,
    ListRecordsRequest,
    PopulatedRecord,
    PrincipalType,
    SeekPage,
    TableWebhookEventType,
    UpdateRecordRequest,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
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
        if (records.length > 0) {
            await recordService.triggerWebhooks({
                projectId: request.principal.projectId,
                tableId: request.body.tableId,
                eventType: TableWebhookEventType.RECORD_CREATED,
                data: { records },
                authorization: request.headers.authorization as string,
            })
        }
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
            authorization: request.headers.authorization as string,
        })
    })

    fastify.delete('/:id', DeleteRecordRequest, async (request, reply) => {
        const deletedRecord = await recordService.delete({
            id: request.params.id,
            projectId: request.principal.projectId,
        })

        if (!deletedRecord) {
            return reply.status(StatusCodes.NOT_FOUND).send()
        }

        await reply.status(StatusCodes.NO_CONTENT).send()
        await recordService.triggerWebhooks({
            projectId: request.principal.projectId,
            tableId: deletedRecord.tableId,
            eventType: TableWebhookEventType.RECORD_DELETED,
            data: { record: deletedRecord },
            authorization: request.headers.authorization as string,
        })
    })

    fastify.post('/list', ListRequest, async (request) => {
        return recordService.list({
            tableId: request.body.tableId,
            projectId: request.principal.projectId,
            cursorRequest: request.body.cursor ?? null,
            limit: request.body.limit ?? DEFAULT_PAGE_SIZE,
            filters: request.body.filters ?? null,
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
    },
    schema: {
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
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const ListRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        body: ListRecordsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(PopulatedRecord),
        },
    },
}
