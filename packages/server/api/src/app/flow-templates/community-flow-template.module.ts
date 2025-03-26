import {
    ALL_PRINCIPAL_TYPES,
    isNil,
    ListFlowTemplatesRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { paginationHelper } from '../helper/pagination/pagination-utils'

export const communityFlowTemplateModule: FastifyPluginAsyncTypebox = async (
    app,
) => {
    // todo(Rupal): Eventually remove this as we don't want to depend on activepieces in case we can't keep our version up-to-date
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates/community' })
}

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: ListFlowTemplatesRequest,
            },
        },
        async (request) => {
            // todo (htookyaw or rupal) fix temporary to use the correct activepieces community template
            // const templateSource = system.get(AppSystemProp.TEMPLATES_SOURCE_URL)
            const templateSource = 'https://cloud.activepieces.com/api/v1/flow-templates'
            
            if (isNil(templateSource)) {
                return paginationHelper.createPage([], null)
            }
            const queryString = convertToQueryString(request.query)
            const url = `${templateSource}?${queryString}`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const templates = await response.json()
            return templates
        },
    )
}

function convertToQueryString(params: ListFlowTemplatesRequest): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((val) => {
                if (!isNil(val)) {
                    searchParams.append(key, val)
                }
            })
        }
        else if (!isNil(value)) {
            searchParams.set(key, value.toString())
        }
    })

    return searchParams.toString()
}
