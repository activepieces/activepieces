import {
    ApId,
    OptionalBooleanFromQuery,
    USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { humanInputService } from './human-input.service'

export const formController: FastifyPluginAsyncZod = async (app) => {
    app.get('/form/:flowId', GetFormRequest, async (request) => {
        return humanInputService(request.log).getFormByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false)
    })
}

const GetFormRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        description: 'Get a form by flow id',
        params: z.object({
            flowId: ApId,
        }),
        querystring: z.object({
            [USE_DRAFT_QUERY_PARAM_NAME]: OptionalBooleanFromQuery,
        }),
    },
} 