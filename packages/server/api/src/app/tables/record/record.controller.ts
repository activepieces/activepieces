import { CreateRecordsRequest, ListRecordsRequest, PopulatedRecord, PrincipalType, SeekPage, UpdateRecordRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { recordService } from './record.service'

const DEFAULT_PAGE_SIZE = 10

export const recordController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/', CreateRequest, async (request, reply) => {
        const response = await recordService.create({
            request: request.body,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.CREATED).send(response)
    },
    )

    fastify.get('/:id', GetRecordByIdRequest, async (request) => {
        return recordService.getById({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
    },
    )

    fastify.post('/:id', UpdateRequest, async (request) => {
        return recordService.update({
            id: request.params.id,
            request: request.body,
            projectId: request.principal.projectId,
        })
    },
    )

    fastify.delete('/:id', DeleteRecordRequest, async (request, reply) => {
        await recordService.delete({
            id: request.params.id,
            projectId: request.principal.projectId,
        })

        await reply.status(StatusCodes.NO_CONTENT).send()
    },
    )

    fastify.post('/list', ListRequest, async (request) => {
        return recordService.list({
            tableId: request.body.tableId,
            projectId: request.principal.projectId,
            cursorRequest: request.body.cursor ?? null,
            limit: request.body.limit ?? DEFAULT_PAGE_SIZE,
            filters: request.body.filters ?? null,
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