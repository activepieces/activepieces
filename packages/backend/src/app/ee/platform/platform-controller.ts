import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { UpdatePlaformRequest } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { platformService } from './platform.service'

export const platformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformController, { prefix: '/v1/platforms' })
}

const platformController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {

    fastify.post(
        '/:platformId',
        {
            schema: {
                body: UpdatePlaformRequest,
                params: Type.Object({
                    platformId: Type.String(),
                }),
            },
        },
        async (request) => {
            const platform = await platformService.getOrThrow({
                id: request.params.platformId,
            })
            // TODO ADD MORE SECURITY CHECKS
            if (isNil(platform) || platform.ownerId !== request.params.platformId) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: 'Platform not found',
                    },
                })
            }
            //  return await platform.update(request.principal.projectId, request.body)
        },
    )

    done()
}
