import fs from 'node:fs'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { builderService } from './builder.service'


export const builderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(builderController, { prefix: '/v1/builder' })
}

const builderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', BuilderRequestParams, async () => {
        const filePath  = 'packages/server/api/src/app/builder/builder.html'
        const stream = fs.createReadStream(filePath, 'utf8')
        return stream
    })

    app.post('/flow/:id', UpdateBuilderFlowRequestParams, async (request) => {
        const platformId = request.principal.platform.id
        const projectId = request.principal.projectId
        const userId = request.principal.id
        const { messages } = request.body
        request.log.info({ messages }, 'messages')
        const result = await builderService(request.log).runAndUpdate({
            userId,
            projectId,
            platformId,
            flowId: request.params.id,
            messages,
        })
        // request.log.info({ steps: result.steps }, 'execution steps')
        return result.text
    })
}

const UpdateBuilderFlowRequest = Type.Object({
    messages: Type.Array(Type.Object({
        role: Type.Union([Type.Literal('assistant'), Type.Literal('user')]),
        content: Type.String(),
    }))
})

const UpdateBuilderFlowRequestParams = {
    schema: {
        body: UpdateBuilderFlowRequest,
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.CREATED]: Type.Any(),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const BuilderRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.UNKNOWN],
    },
}
