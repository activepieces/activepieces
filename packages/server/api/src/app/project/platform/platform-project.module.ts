/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformProjectController } from './platform-project.controller'

export const platformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
}
