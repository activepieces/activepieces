import {
    ALL_PRINCIPAL_TYPES,
    ApId,
    USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { humanInputService } from './human-input.service'

export const formController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/form/:flowId', GetFormRequest, async (request) => {
        return humanInputService(request.log).getFormByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false)
    })
}

const GetFormRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        description: 'Get a form by flow id',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [USE_DRAFT_QUERY_PARAM_NAME]: Type.Optional(Type.Boolean()),
        }),
    },
} 