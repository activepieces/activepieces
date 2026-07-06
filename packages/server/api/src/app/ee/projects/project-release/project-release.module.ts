import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { projectReleaseController } from './project-release.controller'

export const projectReleaseModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.environmentsEnabled))
    await app.register(projectReleaseController, { prefix: '/v1/project-releases' })
}
    