import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { userService } from './user-service'

export const userModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(usersController, { prefix: '/v1/users' })
}

const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', async (request: FastifyRequest) => {
        const user = await userService.getMetaInfo({
            id: request.principal.id,
        })
        return user
    })
}
