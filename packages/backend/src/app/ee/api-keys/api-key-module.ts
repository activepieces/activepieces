import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { ApId, assertNotNullOrUndefined } from '@activepieces/shared'
import { apiKeyService } from './api-key-service'
import { CreateApiKeyRequest } from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'

export const apiKeyModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)
    await app.register(apiKeyController, { prefix: '/v1/api-keys' })
}


export const apiKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateRequest, async (req, res) => {
        const platformId = req.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')

        const newApiKey = await apiKeyService.add({
            userId: req.principal.id,
            platformId,
            displayName: req.body.displayName,
        })

        await res.status(StatusCodes.CREATED).send(newApiKey)
    })

    app.get('/', {}, async (req) => {
        const platformId = req.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return apiKeyService.list({
            platformId,
        })
    })

    app.delete('/:id', DeleteRequest, async (req, res) => {
        const platformId = req.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        await apiKeyService.delete({
            id: req.params.id,
            platformId,
        })
        return res.status(StatusCodes.OK).send()
    })
}



const CreateRequest = {
    schema: {
        body: CreateApiKeyRequest,
    },
}

const DeleteRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
