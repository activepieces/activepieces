import {
    ApiKeyResponseWithoutValue,
    ApiKeyResponseWithValue,
    CreateApiKeyRequest } from '@activepieces/ee-shared'
import { ApId, assertNotNullOrUndefined, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { apiKeyService } from './api-key-service'

export const apiKeyModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.apiKeysEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(apiKeyController, { prefix: '/v1/api-keys' })
}

export const apiKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        const newApiKey = await apiKeyService.add({
            platformId,
            displayName: req.body.displayName,
        })

        return res.status(StatusCodes.CREATED).send(newApiKey)
    })

    app.get('/', ListRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return apiKeyService.list({
            platformId,
        })
    })

    app.delete('/:id', DeleteRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        await apiKeyService.delete({
            id: req.params.id,
            platformId,
        })
        return res.status(StatusCodes.OK).send()
    })
}

const ListRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ApiKeyResponseWithoutValue),
        },
    },
}

const CreateRequest = {
    schema: {
        body: CreateApiKeyRequest,
        response: {
            [StatusCodes.CREATED]: ApiKeyResponseWithValue,
        },
    },
}

const DeleteRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
