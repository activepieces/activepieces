import { AppSystemProp } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    ListFlowTemplatesRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { flowTemplateService } from './flow-template.service'

const ListFlowParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['flow-templates'],
        description: 'List cloud flow templates',
        querystring: ListFlowTemplatesRequest,
    },
}

export const cloudFlowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates/cloud' })
}

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/', ListFlowParams, async (request) => {
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        const platform = await platformService.getOneOrThrow(cloudPlatformId)
        return flowTemplateService.list(platform.id, request.query)
    })
}
