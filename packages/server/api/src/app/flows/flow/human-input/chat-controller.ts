import {
    ALL_PRINCIPAL_TYPES,
    ApId,
    USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { humanInputService } from './human-input.service'

export const chatController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/chat/:flowId', GetChatRequest, async (request) => {
        return humanInputService(request.log).getChatUIByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false)
    })
}

const GetChatRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        description: 'Get a chat UI by flow id',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [USE_DRAFT_QUERY_PARAM_NAME]: Type.Optional(Type.Boolean()),
        }),
    },
}

