import { ALL_PRINCIPAL_TYPES, CreateTodoRequestBody, ListTodoAssigneesRequestQuery, ListTodosQueryParams, PrincipalType, ResolveTodoRequestQuery, SeekPage, TodoEnvironment, UpdateTodoRequestBody, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { userService } from '../user/user-service'
import { todoService } from './todo.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const todoController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListTodosRequest, async (request) => {
        const { platformId, projectId, assigneeId, limit, cursor, statusOptions, title } = request.query
        return todoService(request.log).list({
            platformId,
            projectId,
            assigneeId,
            limit: limit ?? DEFAULT_LIMIT,
            cursor: cursor ?? DEFAULT_CURSOR,
            statusOptions,
            title,
        })
    })

    app.get('/:id', GetTodoRequest, async (request) => {
        const { id } = request.params
        return todoService(request.log).getOnePopulatedOrThrow({
            id,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/', CreateTodoRequest, async (request) => {
        const { title, description, statusOptions, flowId, runId, assigneeId, resolveUrl, environment } = request.body
        return todoService(request.log).create({
            title,
            description,
            statusOptions,
            flowId,
            runId,
            assigneeId,
            environment: environment ?? TodoEnvironment.PRODUCTION,
            resolveUrl,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/:id', UpdateTodoRequest, async (request) => {
        const { id } = request.params
        const { title, description, status, statusOptions, assigneeId, isTest } = request.body
        return todoService(request.log).update({
            id,
            title,
            description,
            status,
            statusOptions,
            assigneeId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            isTest,
            socket: app.io,
        })
    })
    
    app.all('/:id/resolve', RequestResolveTodoRequest, async (request) => {
        const { id } = request.params
        const { status, isTest } = request.query
        return todoService(request.log).resolve({
            id,
            status,
            isTest,
            socket: app.io,
        })
    })

    app.get('/assignees', ListTodoAssigneesRequest, async (request) => {
        const users = await userService.listProjectUsers({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
        return paginationHelper.createPage(users, null)
    })

    app.delete('/:id', DeleteTodoRequest, async (request) => {
        const { id } = request.params
        return todoService(request.log).delete({
            id,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })
}

const DeleteTodoRequest = {

    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}


const ListTodoAssigneesRequest = {
    schema: {
        querystring: ListTodoAssigneesRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(UserWithMetaInformation),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },

}


const ListTodosRequest = {
    schema: {
        querystring: ListTodosQueryParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const CreateTodoRequest = {
    schema: {
        body: CreateTodoRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
    },
}

const RequestResolveTodoRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        querystring: ResolveTodoRequestQuery,
    },
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}

const GetTodoRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
    },
}

const UpdateTodoRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateTodoRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}