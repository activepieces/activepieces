import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { platformProjectMemberController } from './platform-project-member.controller'

export const platformProjectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.projectRolesEnabled))
    await app.register(platformProjectMemberController, {
        prefix: '/v1/platform-project-members',
    })
}
