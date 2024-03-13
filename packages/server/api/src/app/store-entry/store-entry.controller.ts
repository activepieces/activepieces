import { FastifyRequest } from 'fastify'
import { storeEntryService } from './store-entry.service'
import {
    DeleteStoreEntryRequest,
    GetStoreEntryRequest,
    PrincipalType,
    PutStoreEntryRequest,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const storeEntryController: FastifyPluginAsyncTypebox = async (
    fastify,
) => {
    fastify.post(
        '/',
        {
            schema: {
                body: PutStoreEntryRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: PutStoreEntryRequest
            }>,
            _reply,
        ) => {
            return storeEntryService.upsert({
                projectId: request.principal.projectId,
                request: request.body,
            })
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: GetStoreEntryRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: GetStoreEntryRequest
            }>,
            reply,
        ) => {
            const value = await storeEntryService.getOne({
                projectId: request.principal.projectId,
                key: request.query.key,
            })

            if (!value) {
                return reply.code(StatusCodes.NOT_FOUND).send('Value not found!')
            }

            return value
        },
    )

    fastify.delete(
        '/',
        {
            schema: {
                querystring: DeleteStoreEntryRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: DeleteStoreEntryRequest
            }>,
            reply,
        ) => {
            if (request.principal.type !== PrincipalType.WORKER) {
                return reply.status(StatusCodes.FORBIDDEN)
            }
            else {
                return storeEntryService.delete({
                    projectId: request.principal.projectId,
                    key: request.query.key,
                })
            }
        },
    )
}
