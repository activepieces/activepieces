import { CreateRecordsRequest, PrincipalType, UpdateRecordRequest } from '@activepieces/shared'
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}