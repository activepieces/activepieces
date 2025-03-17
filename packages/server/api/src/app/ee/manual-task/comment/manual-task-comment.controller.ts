import { CreateManualTaskCommentRequestBody, ListManualTaskCommentsQueryParams } from '@activepieces/ee-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { manualTaskCommentService } from './manual-task-comment.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const manualTaskCommentController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListManualTaskCommentsRequest, async (request) => {
        return manualTaskCommentService(request.log).list({
            taskId: request.query.taskId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            limit: request.query.limit ?? DEFAULT_LIMIT,
            cursor: request.query.cursor ?? DEFAULT_CURSOR,
        })
    })

    app.post('/', CreateManualTaskCommentRequest, async (request) => {
        const { content } = request.body
        return manualTaskCommentService(request.log).create({
            content,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            userId: request.principal.id,
            taskId: request.params.taskId,
        })
    })
}


const ListManualTaskCommentsRequest = {
    schema: {
        querystring: ListManualTaskCommentsQueryParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const CreateManualTaskCommentRequest = {
    schema: {
        params: Type.Object({
            taskId: Type.String(),
        }),
        body: CreateManualTaskCommentRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
