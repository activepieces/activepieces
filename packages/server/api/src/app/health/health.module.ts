import { ActivepiecesError, ALL_PRINCIPAL_TYPES, ErrorCode } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const healthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(healthController, { prefix: '/v1/health' })
}

export const healthStatus = {
    isReady: false
}

const healthController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
        },
        async () => {
            if (!healthStatus.isReady) {
                throw new ActivepiecesError({
                    code: ErrorCode.MACHINE_NOT_AVAILABLE,
                    params: {
                        resourceType: 'health'
                    }
                })
            }
            return { status: 'OK' }
        },
    )
}
