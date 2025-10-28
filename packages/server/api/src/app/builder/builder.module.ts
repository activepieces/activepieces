import { BuilderMessage, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { builderService } from './builder.service'


export const builderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(builderController, { prefix: '/v1/builder' })
}

const builderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/flow/:id', GetBuilderFlowRequestParams, async (request, reply) => {
        const projectId = request.principal.projectId
        const flowId = request.params.id
        const messages = await builderService(app.log).fetchMessages({
            projectId,
            flowId,
        })
        const jsonContentMessages = messages.map((m) => ({ ...m, content: JSON.stringify(m.content) }))
        return reply.send(jsonContentMessages)
    })

    app.post('/flow/:id', UpdateBuilderFlowRequestParams, async (request) => {
        const platformId = request.principal.platform.id
        const projectId = request.principal.projectId
        const userId = request.principal.id
        const { messages } = request.body
        const text = await builderService(request.log).runAndUpdate({
            userId,
            projectId,
            platformId,
            flowId: request.params.id,
            messages,
        })
        return text
    })
}

const GetBuilderFlowRequestParams = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Type.Array(BuilderMessage),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const UpdateBuilderFlowRequest = Type.Object({
    messages: Type.Array(Type.Object({
        role: Type.Union([Type.Literal('assistant'), Type.Literal('user')]),
        content: Type.String(),
    })),
})

const UpdateBuilderFlowRequestParams = {
    schema: {
        body: UpdateBuilderFlowRequest,
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.CREATED]: Type.String(),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
