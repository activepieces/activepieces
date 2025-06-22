import { ContentBlockType, CreateTodoActivityRequestBody, isNil, ListTodoActivitiesQueryParams, PrincipalType, RichContentBlock } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { todoActivitiesService as todoActivityService } from './todos-activity.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const todoActivityController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:todoId/activities', ListTodoCommentsRequest, async (request) => {
        return todoActivityService(request.log).list({
            todoId: request.params.todoId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            limit: request.query.limit ?? DEFAULT_LIMIT,
            cursor: request.query.cursor ?? DEFAULT_CURSOR,
        })
    })

    app.post('/:todoId/activities', CreateTodoCommentRequest, async (request) => {
        const { content } = request.body
        return todoActivityService(request.log).create({
            content: convertMarkdownToContentBlocks(content)!,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            userId: request.principal.id,
            todoId: request.params.todoId,
            socket: app.io,
            agentId: null,
        })
    })
}

function convertMarkdownToContentBlocks(markdown: string | undefined): RichContentBlock[] | undefined {
    if (isNil(markdown)) {
        return undefined
    }
    return [
        {
            type: ContentBlockType.MARKDOWN,
            markdown,
        },
    ]
}
const ListTodoCommentsRequest = {
    schema: {
        params: Type.Object({
            todoId: Type.String(),
        }),
        querystring: ListTodoActivitiesQueryParams,
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
        body: CreateTodoActivityRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
