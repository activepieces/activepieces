import { FastifyInstance } from 'fastify'
import { projectController } from './project.controller'

export const projectModule = async (app: FastifyInstance) => {
    app.register(projectController, { prefix: '/v1/projects' })
}
