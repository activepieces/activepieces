import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { approvalTaskController } from "./apporval-task.controller";
import { platformMustBeOwnedByCurrentUser } from "../authentication/ee-authorization";
import { approvalTaskCommentController } from "./apporval-task-comment.controller";
export const approvalTaskModule: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    fastify.register(approvalTaskController, { prefix: '/v1/approval-tasks' })
    fastify.register(approvalTaskCommentController, { prefix: '/v1/approval-tasks' })
}

