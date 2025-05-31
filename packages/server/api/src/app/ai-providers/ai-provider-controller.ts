import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ConfiguredAIProviderWithoutSensitiveData, CreateAIProviderRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../helper/system/system'
import { aiProviderService } from './ai-provider-service'

// TODO (@amrdb) handle isEnterpriseCustomerOnCloud
const isCloudEdition = system.getEdition() === ApEdition.CLOUD

export const aiProviderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAIProviders, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.list(isCloudEdition ? system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID) : platformId)
    })
    app.post('/', CreateAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.create(platformId, request.body)
    })
    app.delete('/:id', DeleteAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.delete(platformId, request.params.id)
    })

    // Register proxy route for AI providers
    
}

const ListAIProviders = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ConfiguredAIProviderWithoutSensitiveData),
        },
    },
}

const CreateAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: CreateAIProviderRequest,
    },
}

const DeleteAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
