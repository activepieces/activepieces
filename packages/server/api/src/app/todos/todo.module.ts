import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { todoController } from './todo.controller'

export const todoModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(todoController, { prefix: '/v1/todos' })
    
}