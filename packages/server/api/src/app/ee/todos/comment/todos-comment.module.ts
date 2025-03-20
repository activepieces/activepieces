import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { todoCommentController } from './todos-comment.controller'

export const todoCommentModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(todoCommentController, { prefix: '/v1/todos' })
}