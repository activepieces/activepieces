import { FastifyInstance, FastifyRequest } from 'fastify'
import { storeEntryService } from './store-entry.service'
import { DeletStoreEntryRequest, GetStoreEntryRequest, PrincipalType, PutStoreEntryRequest } from '@activepieces/shared'
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
                _reply.status(StatusCodes.FORBIDDEN)
                return
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
                querystring: GetStoreEntryRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: GetStoreEntryRequest
            }>,
            _reply,
        ) => {
            if (request.principal.type !== PrincipalType.WORKER) {
                _reply.status(StatusCodes.FORBIDDEN)
                return
            }
            else {
                return await storeEntryService.getOne(request.principal.collectionId, request.query.key)
            }
        },
    )


    fastify.delete(
        '/',
        {
            schema: {
                querystring: DeletStoreEntryRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: DeletStoreEntryRequest
            }>,
            _reply,
        ) => {
            if (request.principal.type !== PrincipalType.WORKER) {
                _reply.status(StatusCodes.FORBIDDEN)
                return
            }
            else {
                return await storeEntryService.delete(request.principal.collectionId, request.query.key)
            }
        },
    )
}
