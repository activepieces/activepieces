import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { entitiesMustBeOwnedByCurrentProject } from '../../../authentication/authorization'
import { platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { projectMemberController } from './project-member.controller'

export const projectMemberModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled))
    await app.register(projectMemberController, {
        prefix: '/v1/project-members',
    })
}
