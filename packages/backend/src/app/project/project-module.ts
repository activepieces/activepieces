import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectService } from './project-service'
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'

export const projectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectController, { prefix: '/v1/projects' })
}

const projectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
    
    fastify.get('/', async (request) => {
        return [await projectService.getUserProject(request.principal.id)]
    })


    done()
}
