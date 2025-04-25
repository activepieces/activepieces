/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { userPlatformProjectController } from './user-project.controller'

export const userPlatformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(userPlatformProjectController, { prefix: '/v1/users/projects' })
}
