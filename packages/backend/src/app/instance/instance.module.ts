import { FastifyInstance } from 'fastify'
import { instanceController } from './instance.controller'

export const instanceModule = async (app: FastifyInstance) => {
    app.register(instanceController, { prefix: '/v1/instances' })
}
