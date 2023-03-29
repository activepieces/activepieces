import { FastifyInstance } from 'fastify'
import { flowController } from './flow.controller'

export const flowModule = async (app: FastifyInstance) => {
    app.register(flowController, { prefix: '/v1/flows' })
}
