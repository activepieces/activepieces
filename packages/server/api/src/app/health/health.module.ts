import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const healthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(healthController, { prefix: '/v1/health' })
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
            return { status: 'OK' }
        },
    )
}
