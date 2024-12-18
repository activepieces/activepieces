import { CreateRecordsRequest, ListRecordsRequest, PopulatedRecord, PrincipalType, SeekPage, UpdateRecordRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { recordService } from './record.service'

const DEFAULT_PAGE_SIZE = 10

export const recordController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/:id/records', CreateRequest, async (request, reply) => {
        const response = await recordService.create({
            tableId: request.params.id,
            request: request.body,
        })
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.get('/:id/records/:recordId', GetRecordByIdRequest, async (request, reply) => {
        const response = await recordService.getById({
            tableId: request.params.id,
            id: request.params.recordId,
        })

        if (!response) {
            await reply.status(StatusCodes.NOT_FOUND).send('Record not found')
            return
        }

        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.post('/:id/records/:recordId', UpdateRequest, async (request, reply) => {
        const response = await recordService.update({
            tableId: request.params.id,
            id: request.params.recordId,
            request: request.body,
        })

        if (!response) {
            await reply.status(StatusCodes.NOT_FOUND).send('Record not found')
            return
        }

        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.delete('/:id/records/:recordId', DeleteRecordRequest, async (request, reply) => {
        await recordService.delete({
            tableId: request.params.id,
            id: request.params.recordId,
        })

        await reply.status(StatusCodes.OK).send()
    },
    )

    fastify.get('/:id/records', ListRequest, async (request) => {
        return recordService.list({
            tableId: request.params.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
        })
    },
    )
}

const CreateRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        body: CreateRecordsRequest,
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Type.Array(PopulatedRecord),
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
            recordId: Type.String(),
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
            recordId: Type.String(),
        }),
        body: UpdateRecordRequest,
        response: {
            [StatusCodes.OK]: PopulatedRecord,
            [StatusCodes.NOT_FOUND]: Type.String(),
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
            recordId: Type.String(),
        }),
    },
}

const ListRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        querystring: ListRecordsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(PopulatedRecord),
        },
    },
}