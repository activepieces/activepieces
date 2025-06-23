import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectReleaseController } from './project-release.controller'

export const projectReleaseModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectReleaseController, { prefix: '/v1/project-releases' })
}
    