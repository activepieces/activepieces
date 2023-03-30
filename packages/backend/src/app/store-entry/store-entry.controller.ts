import { FastifyInstance, FastifyRequest } from 'fastify'
import { storeEntryService } from './store-entry.service'
import { PrincipalType, PutStoreEntryRequest } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'

export const storeEntryController = async (fastify: FastifyInstance) => {
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
            if (request.principal.type !== PrincipalType.WORKER) {
                _reply.status(StatusCodes.FORBIDDEN).send()
            }
            else {
                return await storeEntryService.upsert(request.principal.collectionId, request.body)
            }
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        key: { type: 'string' },
                    },
                    required: ['key'],
                },
            },
        },
        async (
            request: FastifyRequest<{
                Body: PutStoreEntryRequest
                Querystring: {
                    key: string
                }
            }>,
            _reply,
        ) => {
            if (request.principal.type !== PrincipalType.WORKER) {
                _reply.status(StatusCodes.FORBIDDEN).send()
            }
            else {
                return await storeEntryService.getOne(request.principal.collectionId, request.query.key)
            }
        },
    )
}
