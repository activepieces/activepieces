import { FastifyInstance } from 'fastify'
import { flowInstanceController } from './flow-instance.controller'

export const flowInstanceModule = async (app: FastifyInstance) => {
    app.register(flowInstanceController, { prefix: '/v1/flow-instances' })
}
