import {
    ALL_PRINICPAL_TYPES,
    ApId,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { FORMS_PIECE_NAME, FORMS_TRIGGER_NAMES, formService } from './form.service'

export const formController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:flowId', GetFlowRequestOptions, async (request, reply) => {
        const form = await formService.getFormByFlowId(request.params.flowId)

        if (!form || !FORMS_TRIGGER_NAMES.includes(form.version.trigger.settings.triggerName) || form.version.trigger.settings.pieceName !== FORMS_PIECE_NAME) {
            return reply.status(404).send({ message: 'Form not found' })
        }

        return reply.send({ id: form.id, triggerName: form.version.trigger.settings.triggerName, title: form.version.displayName, projectId: form.projectId, props: form.version.trigger.settings.input })
    })
}

const GetFlowRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        tags: ['forms'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get a form by flow id',
        params: Type.Object({
            flowId: ApId,
        }),
    },
}