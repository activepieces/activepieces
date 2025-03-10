import { CreateManualTaskRequestBody, ListManualTasksQueryParams, UpdateManualTaskRequestBody } from '@activepieces/ee-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { manualTaskService } from './manual-task.service'

const DEFAULT_LIMIT = 10

export const manualTaskController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListManualTasksRequest, async (request) => {
        const { platformId, projectId, assigneeId, limit, cursor, statusOptions } = request.query
        return manualTaskService(request.log).list({
            platformId,
            projectId,
            assigneeId,
            limit: limit ?? DEFAULT_LIMIT,
            cursor: cursor ?? null,
            statusOptions,
        })
    })

    app.get('/:id', GetManualTaskRequest, async (request) => {
        const { id } = request.params
        return manualTaskService(request.log).getOneOrThrow({
            id,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/', CreateManualTaskRequest, async (request) => {
        const { title, description, status, statusOptions, flowId, runId, assigneeId } = request.body
        return manualTaskService(request.log).create({
            title,
            description,
            status,
            statusOptions,
            flowId,
            runId,
            assigneeId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/:id', UpdateManualTaskRequest, async (request) => {
        const { id } = request.params
        const { title, description, status, statusOptions, assigneeId } = request.body
        return manualTaskService(request.log).update({
            id,
            title,
            description,
            status,
            statusOptions,
            assigneeId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })
}

const ListManualTasksRequest = {
    schema: {
        querystring: ListManualTasksQueryParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const CreateManualTaskRequest = {
    schema: {
        body: CreateManualTaskRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const GetManualTaskRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const UpdateManualTaskRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateManualTaskRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}