import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { projectMemberController } from './project-member.controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'

export const projectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.projectRolesEnabled))
    await app.register(projectMemberController, {
        prefix: '/v1/project-members',
    })
}
