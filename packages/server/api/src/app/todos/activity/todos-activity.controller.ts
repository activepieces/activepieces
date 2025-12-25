import { EntitySourceType, ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { CreateTodoActivityRequestBody, ListTodoActivitiesQueryParams, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { TodoEntity } from '../todo.entity'
import { todoActivitiesService as todoActivityService } from './todos-activity.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const todoActivityController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListTodoCommentsRequest, async (request) => {
        return todoActivityService(request.log).list({
            todoId: request.query.todoId,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            limit: request.query.limit ?? DEFAULT_LIMIT,
            cursor: request.query.cursor ?? DEFAULT_CURSOR,
        })
    })

    app.post('/', CreateTodoCommentRequest, async (request) => {
        const { content } = request.body
        return todoActivityService(request.log).create({
            content,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            userId: request.principal.id,
            todoId: request.body.todoId,
            socket: app.io,
        })
    })
}

const ListTodoCommentsRequest = {
    schema: {
        querystring: ListTodoActivitiesQueryParams,
    },
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: TodoEntity,
            entitySourceType: EntitySourceType.QUERY,
            lookup: {
                paramKey: 'todoId',
                entityField: 'id',
            },
        }),
    },
}


const CreateTodoCommentRequest = {
    schema: {
        body: CreateTodoActivityRequestBody,
    },
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: TodoEntity,
            entitySourceType: EntitySourceType.BODY,
            lookup: {
                paramKey: 'todoId',
                entityField: 'id',
            },
        }),
    },
}
