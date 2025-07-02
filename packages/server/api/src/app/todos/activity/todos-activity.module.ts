import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { todoActivityController } from './todos-activity.controller'

export const todoActivityModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(todoActivityController, { prefix: '/v1/todo-activities' })
}