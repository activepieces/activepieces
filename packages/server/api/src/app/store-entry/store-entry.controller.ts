import {
    DeleteStoreEntryRequest,
    GetStoreEntryRequest,
    PrincipalType,
    PutStoreEntryRequest,
    STORE_VALUE_MAX_SIZE,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import sizeof from 'object-sizeof'
import { storeEntryService } from './store-entry.service'

export const storeEntryController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post( '/', CreateRequest, async (request, reply) => {
        const sizeOfValue = sizeof(request.body.value)
        if (sizeOfValue > STORE_VALUE_MAX_SIZE) {
            await reply.status(StatusCodes.REQUEST_TOO_LONG).send({})
            return
        }
        const response = await storeEntryService.upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })
        await reply.status(StatusCodes.OK).send(response)
    },
    )

    fastify.get('/', GetRequest, async (request, reply) => {
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

    fastify.delete( '/', DeleteStoreRequest, async (request) => {
        return storeEntryService.delete({
            projectId: request.principal.projectId,
            key: request.query.key,
        })
    },
    )
}

const CreateRequest =  {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        body: PutStoreEntryRequest,
    },
}

const GetRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        querystring: GetStoreEntryRequest,
    },
}


const DeleteStoreRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        querystring: DeleteStoreEntryRequest,
    },
}