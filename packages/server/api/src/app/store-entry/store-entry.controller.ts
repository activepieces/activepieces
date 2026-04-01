import {
    DeleteStoreEntryRequest,
    GetStoreEntryRequest,
    PutStoreEntryRequest,
    STORE_VALUE_MAX_SIZE,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import sizeof from 'object-sizeof'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { storeEntryService } from './store-entry.service'

export const storeEntryController: FastifyPluginAsyncZod = async (fastify) => {
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

    fastify.delete('/', DeleteStoreRequest, async (request) => {
        return storeEntryService.delete({
            projectId: request.principal.projectId,
            key: request.query.key,
        })
    },
    )
}

const CreateRequest =  {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: PutStoreEntryRequest,
    },
}

const GetRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        querystring: GetStoreEntryRequest,
    },
}


const DeleteStoreRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        querystring: DeleteStoreEntryRequest,
    },
}