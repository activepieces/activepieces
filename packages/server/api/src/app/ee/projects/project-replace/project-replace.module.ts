import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { projectReplaceController } from './project-replace.controller'

export const projectReplaceModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.environmentsEnabled))
    await app.register(projectReplaceController, { prefix: '/v1/projects' })
}
