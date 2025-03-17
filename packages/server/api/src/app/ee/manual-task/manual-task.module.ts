import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { manualTaskCommentController } from './comment/manual-task-comment.controller'
import { manualTaskController } from './manual-task.controller'

export const manualTaskModule: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    await fastify.register(manualTaskController, { prefix: '/v1/manual-tasks' })
    await fastify.register(manualTaskCommentController, { prefix: '/v1/manual-tasks/:taskId/comments' })
}