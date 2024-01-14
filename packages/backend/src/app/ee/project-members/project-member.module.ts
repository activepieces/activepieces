import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectMemberController } from './project-member.controller'

export const projectMemberModule: ((req: { viewOnly: boolean }) => FastifyPluginAsyncTypebox)  = (req) => {
    const module: FastifyPluginAsyncTypebox = async (app) => {
        await app.register(projectMemberController(req), { prefix: '/v1/project-members' })
    }
    return module
}

