import { securityAccess } from '@activepieces/server-shared'
import {
    ApEdition,
    SERVICE_KEY_SECURITY_OPENAPI,
    TemplateTag,
    TemplateType,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { system } from '../helper/system/system'
import { communityTemplates } from './community-flow-template.service'
import { templateService } from './template.service'

const edition = system.getEdition()

export const deprecatedFlowTemplateController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListFlowTemplatesParams, async (request) => {
        if (edition === ApEdition.CLOUD) {
            return templateService(app.log).list({ platformId: null, requestQuery: {
                ...request.query,
                type: TemplateType.OFFICIAL,
            } })
        }
        return communityTemplates.list({
            ...request.query,
            type: TemplateType.OFFICIAL,
        })
    })
}

const ListFlowTemplatesRequestQuery = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(TemplateTag)),
    search: Type.Optional(Type.String()),
})
type ListFlowTemplatesRequestQuery = Static<typeof ListFlowTemplatesRequestQuery>

const ListFlowTemplatesParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['templates'],
        description: 'List flow templates. This endpoint is deprecated, use /v1/templates instead.',
        deprecated: true,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowTemplatesRequestQuery,
    },
}