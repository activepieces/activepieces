import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { projectReleaseController } from './project-release.controller'

export const projectReleaseModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(projectReleaseController, { prefix: '/v1/project-releases' })
}
    