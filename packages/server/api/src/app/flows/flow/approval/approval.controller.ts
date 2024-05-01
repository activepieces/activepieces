import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { approvalService } from './approval.service'
import { ALL_PRINCIPAL_TYPES, ApId } from '@activepieces/shared'


export const approvalController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/approval/:flowId/:action', GetApprovalRequest, async (request) => {
        return approvalService.getApprovalByFlowIdOrThrow(request.params.flowId, request.params.action)
    })
}

const GetApprovalRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        description: 'Get approval state by flow id',
        params: Type.Object({
            flowId: ApId,
            action: Type.String({
                patter: '^(approved|denied)$',
            }),
        }),
    },
}