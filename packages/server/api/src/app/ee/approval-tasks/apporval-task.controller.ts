import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { approvalTaskService } from './apporval-task.service'

export const approvalTaskController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/', ListApprovalTasksRequest, async (request) => {
        return approvalTaskService(request.log).list({
            projectId: request.principal.projectId,
            assignedUserId: request.query.assigned_user_id,
            limit: request.query.limit,
            cursor: request.query.cursor,
        })
    })

    fastify.get('/:id', GetApprovalTaskRequest, async (request) => {
        return approvalTaskService(request.log).getOne({ id: request.params.id })
    })

    fastify.put('/:id/status', UpdateApprovalTaskStatusRequest, async (request) => {
        return approvalTaskService(request.log).updateSelectedOption({
            id: request.params.id,
            option: request.body.option,
        })
    })
}

const ListApprovalTasksRequestParams = Type.Object({
    assigned_user_id: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

const GetApprovalTaskRequestParams = Type.Object({
    id: Type.String(),
})

const UpdateApprovalTaskStatusRequestBody = Type.Object({
    option: Type.String(),
})

const ListApprovalTasksRequest = {
    schema: {
        querystring: ListApprovalTasksRequestParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
}

const GetApprovalTaskRequest = {
    schema: {
        params: GetApprovalTaskRequestParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
}

const UpdateApprovalTaskStatusRequest = {
    schema: {
        params: GetApprovalTaskRequestParams,
        body: UpdateApprovalTaskStatusRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
}
