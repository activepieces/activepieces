import { ALL_PRINCIPAL_TYPES, CreateRecordsRequest, UpdateRecordRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'

export const recordController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post('/:id/records', CreateRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id/records/:recordId', GetRecordByIdRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.post('/:id/records/:recordId', UpdateRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.delete('/:id/records/:recordId', DeleteRecordRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )

    fastify.get('/:id/records', GetRecordsRequest, async (request, reply) => {
        await reply.status(StatusCodes.OK).send({})
    },
    )
}

const CreateRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: CreateRecordsRequest,
        // response: {
        //     [StatusCodes.OK]: Type.Array(Record),
        // },
    },
}

const GetRecordByIdRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            recordId: Type.String(),
        }),
    },
}

const UpdateRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            recordId: Type.String(),
        }),
        body: UpdateRecordRequest,
    },
}

const DeleteRecordRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
            recordId: Type.String(),
        }),
    },
}

const GetRecordsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}