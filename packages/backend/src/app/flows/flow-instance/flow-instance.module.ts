import { FastifyInstance } from 'fastify'
import { flowInstanceController } from './flow-instance.controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'

export const flowInstanceModule = async (app: FastifyInstance) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.register(flowInstanceController, { prefix: '/v1/flow-instances' })
}
