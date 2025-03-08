import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import { approvalTaskCommentService } from "./apporval-task-comment.service"
import { PrincipalType } from "@activepieces/shared"

export const approvalTaskCommentController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/:taskId/comments', ListApprovalTaskCommentsRequest, async (request) => {
        return await approvalTaskCommentService(request.log).list({
            taskId: request.params.taskId
        })
    })

    fastify.post('/:taskId/comments', CreateApprovalTaskCommentRequest, async (request) => {
        return await approvalTaskCommentService(request.log).create({
            taskId: request.params.taskId,
            userId: request.principal.id,
            comment: request.body.comment
        })
    })
}

const ListApprovalTaskCommentsRequest = {
    schema: {
        params: Type.Object({
            taskId: Type.String()
        })
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
}

const CreateApprovalTaskCommentRequest = {
    schema: {
        params: Type.Object({
            taskId: Type.String()
        }),
        body: Type.Object({
            comment: Type.String()
        })
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
}
