import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { formService } from './form.service'
import {
    ALL_PRINCIPAL_TYPES,
    ApId,
} from '@activepieces/shared'


export const formController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:flowId', GetFormRequest, async (request) => {
        return formService.getFormByFlowIdOrThrow(request.params.flowId)
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
    },
}