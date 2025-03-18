import { CreateManualTaskRequestBody, ListManualTasksQueryParams, UpdateManualTaskRequestBody } from '@activepieces/ee-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { manualTaskService } from './manual-task.service'

const DEFAULT_LIMIT = 10
const DEFAULT_CURSOR = null

export const manualTaskController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListManualTasksRequest, async (request) => {
        const { platformId, projectId, assigneeId, limit, cursor, statusOptions, title } = request.query
        return manualTaskService(request.log).list({
            platformId,
            projectId,
            assigneeId,
            limit: limit ?? DEFAULT_LIMIT,
            cursor: cursor ?? DEFAULT_CURSOR,
            statusOptions,
            title,
        })
    })

    app.get('/:id', GetManualTaskRequest, async (request) => {
        const { id } = request.params
        return manualTaskService(request.log).getOnePopulatedOrThrow({
            id,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/', CreateManualTaskRequest, async (request) => {
        const { title, description, statusOptions, flowId, runId, assigneeId, approvalUrl } = request.body
        return manualTaskService(request.log).create({
            title,
            description,
            statusOptions,
            flowId,
            runId,
            assigneeId,
            approvalUrl,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
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