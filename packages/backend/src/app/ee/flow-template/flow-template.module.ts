import { flowTemplateService } from './flow-template.service'
import { ListFlowTemplatesRequest } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ShareFlowRequest } from '@activepieces/ee-shared'
import { flowService } from '../../flows/flow/flow.service'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const flowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>


const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:id', {
        schema: {
            params: GetIdParams,
        },
    }, async (request) => {
        return await flowTemplateService.getOrthrow(request.params.id)
    })

    fastify.get('/', {
        schema: {
            querystring: ListFlowTemplatesRequest,
        },
    }, async (request) => {
        return await flowTemplateService.list(request.query)
    })

    fastify.post('/', {
        schema: {
            body: ShareFlowRequest,
        },
    }, async (request) => {
        const flowTemplate = await flowService.getTemplate({ flowId: request.body.flowId, versionId: request.body.flowVersionId, projectId: request.principal.projectId })
        const result = await flowTemplateService.upsert(
            { 
                flowTemplate: {
                    ...flowTemplate,
                    description: request.body.description || '',
                    blogUrl: request.body.blogUrl || '',
                    imageUrl: request.body.imageUrl || '',
                    featuredDescription: request.body.featuredDescription || '',
                    isFeatured: request.body.isFeatured || false,
                    userId: request.principal.id,
                },
                id: request.body.flowId,
                projectId: request.principal.projectId,
            },
        )
        return result
    })
}
