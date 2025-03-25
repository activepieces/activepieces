import { CreateTodoCommentRequestBody, ListTodoCommentsQueryParams } from '@activepieces/ee-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { todoCommentService } from './todos.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const todoCommentController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:todoId/comments', ListTodoCommentsRequest, async (request) => {
        return todoCommentService(request.log).list({
            todoId: request.params.todoId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            limit: request.query.limit ?? DEFAULT_LIMIT,
            cursor: request.query.cursor ?? DEFAULT_CURSOR,
        })
    })

    app.post('/:todoId/comments', CreateTodoCommentRequest, async (request) => {
        const { content } = request.body
        return todoCommentService(request.log).create({
            content,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            userId: request.principal.id,
            todoId: request.params.todoId,
        })
    })
}


const ListTodoCommentsRequest = {
    schema: {
        params: Type.Object({
            todoId: Type.String(),
        }),
        querystring: ListTodoCommentsQueryParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const CreateTodoCommentRequest = {
    schema: {
        params: Type.Object({
            todoId: Type.String(),
        }),
        body: CreateTodoCommentRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
