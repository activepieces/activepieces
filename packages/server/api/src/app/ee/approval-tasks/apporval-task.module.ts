import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { approvalTaskCommentController } from './apporval-task-comment.controller'
import { approvalTaskController } from './apporval-task.controller'
export const approvalTaskModule: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    await fastify.register(approvalTaskController, { prefix: '/v1/approval-tasks' })
    await fastify.register(approvalTaskCommentController, { prefix: '/v1/approval-tasks' })
}

