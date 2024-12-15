import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectVersionController } from './project-version.controller'

export const projectVersionModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectVersionController, { prefix: '/v1/project-versions' })
}
    