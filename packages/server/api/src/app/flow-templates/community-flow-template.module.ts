import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system, SystemProp } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    isNil,
    ListFlowTemplatesRequest,
} from '@activepieces/shared'

export const communityFlowTemplateModule: FastifyPluginAsyncTypebox = async (
    app,
) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
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
            const templateSource = system.get(SystemProp.TEMPLATES_SOURCE_URL)
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
