import { logger } from '@activepieces/server-shared'
import {
    AiProviderConfig,
    AiProviderWithoutSensitiveData,
    EnginePrincipal,
    PrincipalType,
    SeekPage,
    TelemetryEventName,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { telemetry } from '../helper/telemetry.utils'
import { proxyController } from './ai-provider-proxy'
import { aiProviderService } from './ai-provider.service'

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(proxyController, { prefix: '/v1/ai-providers/proxy' })
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
    await app.register(engineAiProviderController, {
        prefix: '/v1/ai-providers',
    })
}

const engineAiProviderController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.get('/', ListProxyConfigRequest, async (request) => {
        const platformId = (request.principal as unknown as EnginePrincipal).platform.id
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
        telemetry
            .trackProject(request.principal.projectId, {
                name: TelemetryEventName.AI_PROVIDER_CONFIGURED,
                payload: {
                    projectId: request.principal.projectId,
                    platformId: request.principal.platform.id,
                    provider: request.body.provider,
                },
            })
            .catch((e) =>
                logger.error(
                    e,
                    '[ConfigureAiProvider#telemetry] telemetry.trackProject',
                ),
            )
        return aiProviderService.upsert(request.principal.platform.id, {
            config: request.body.config,
            baseUrl: request.body.baseUrl,
            provider: request.body.provider,
        })
    })

    fastify.delete(
        '/:provider',
        DeleteProxyConfigRequest,
        async (request, reply) => {
            await aiProviderService.delete({
                platformId: request.principal.platform.id,
                provider: request.params.provider,
            })
            await reply.status(StatusCodes.NO_CONTENT).send()
        },
    )

    done()
}

const ListProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
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
        body: Type.Omit(AiProviderConfig, [
            'id',
            'created',
            'updated',
            'platformId',
        ]),
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
    },
}
