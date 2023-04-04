import { FastifyInstance } from 'fastify'
import { authenticationController } from './authentication.controller'

export const authenticationModule = async (app: FastifyInstance) => {
    app.register(authenticationController, { prefix: '/v1/authentication' })
}
