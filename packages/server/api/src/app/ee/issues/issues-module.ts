import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { issuesController } from './issues-controller'

export const issuesModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.flowIssuesEnabled))
    await app.register(issuesController, { prefix: '/v1/issues' })
}
