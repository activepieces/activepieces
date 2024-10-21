import {
    ALL_PRINCIPAL_TYPES,
    ApId,
    USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { humanInputService } from './human-input.service'


// TODO: rename to human-input controller
// TODO: add an endpoint for Chat UI options
export const humanInputController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/form/:flowId', GetFormRequest, async (request) => {
        return humanInputService.getFormByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false)
    })
    app.get('/chat/:flowId', GetFormRequest, async (request) => {
        return humanInputService.getChatUIByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false)
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