import { FastifyInstance } from 'fastify'
import { fileController } from './file.controller'

export const fileModule = async (app: FastifyInstance) => {
    app.register(fileController, { prefix: '/v1/files' })
}
