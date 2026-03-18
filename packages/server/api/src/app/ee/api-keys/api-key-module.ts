import {
    ApId,
    ApiKeyResponseWithoutValue,
    ApiKeyResponseWithValue, assertNotNullOrUndefined, CreateApiKeyRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { apiKeyService } from './api-key-service'

export const apiKeyModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.apiKeysEnabled))
    await app.register(apiKeyController, { prefix: '/v1/api-keys' })
}

export const apiKeyController: FastifyPluginAsyncZod = async (app) => {
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
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ApiKeyResponseWithoutValue),
        },
    },
}

const CreateRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: CreateApiKeyRequest,
        response: {
            [StatusCodes.CREATED]: ApiKeyResponseWithValue,
        },
    },
}

const DeleteRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
    },
}
