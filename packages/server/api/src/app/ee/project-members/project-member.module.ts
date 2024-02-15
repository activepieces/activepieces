import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectMemberController } from './project-member.controller'

export const projectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectMemberController, {
        prefix: '/v1/project-members',
    })
}
