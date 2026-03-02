import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { scimDiscoveryController } from './scim-discovery-controller'
import { scimGroupController } from './scim-group-controller'
import { scimUserController } from './scim-user-controller'

export const scimModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.scimEnabled))
    app.addContentTypeParser('application/scim+json', { parseAs: 'string' }, function (_req, body, done) {
        try {
            if (body == null || (typeof body === 'string' && body.trim() === '') || (Array.isArray(body) && body.length === 0)) {
                done(null, {})
                return
            }
            const json = JSON.parse(body as string)
            done(null, json)
        }
        catch (err) {
            const error: Error & { statusCode?: number } = err instanceof Error ? err : new Error('JSON parsing failed')
            error.statusCode = 400
            done(error, undefined)
        }
    })
    await app.register(scimUserController, { prefix: '/v1/scim/v2/Users' })
    await app.register(scimGroupController, { prefix: '/v1/scim/v2/Groups' })
    await app.register(scimDiscoveryController, { prefix: '/v1/scim/v2' })
}
