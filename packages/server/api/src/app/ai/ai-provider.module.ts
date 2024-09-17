import { AiProviderConfig, AiProviderWithoutSensitiveData, EnginePrincipal, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { projectService } from '../project/project-service'
import { proxyController } from './ai-provider-proxy'
import { aiProviderService } from './ai-provider.service'

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(proxyController, { prefix: '/v1/ai-providers/proxy' })
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
    await app.register(engineAiProviderController, { prefix: '/v1/ai-providers' })
}

const engineAiProviderController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {

    fastify.get('/', ListProxyConfigRequest, async (request) => {
        const projectId = (request.principal as unknown as EnginePrincipal).projectId
        const platformId = await projectService.getPlatformId(projectId)
        return aiProviderService.list(platformId)
    })  

    done()
}   

const aiProviderController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {

    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    fastify.post('/', CreateProxyConfigRequest, async (request) => {
        return aiProviderService.upsert(request.principal.platform.id, {
            config: request.body.config,
            baseUrl: request.body.baseUrl,
            provider: request.body.provider,
        })
    })

    fastify.delete('/:provider', DeleteProxyConfigRequest, async (request, reply) => {
        await aiProviderService.delete({
            platformId: request.principal.platform.id,
            provider: request.params.provider,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    done()
}


const ListProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        tags: ['ai-providers'],
        description: 'List ai provider configs',
        response: {
            [StatusCodes.OK]: SeekPage(AiProviderWithoutSensitiveData),
        },
    },
}

const CreateProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        tags: ['ai-providers'],
        description: 'Create ai provider config',
        body: Type.Omit(AiProviderConfig, ['id', 'created', 'updated', 'platformId']),
    },
}

const DeleteProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            provider: Type.String(),
        }),
        tags: ['ai-providers'],
        description: 'Delete ai provider config',
    },
}
