import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { changelogService } from './changelog.service'

export const changelogController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListChangelogsRequest, async (request) => {
        return changelogService(request.log).list()
    })

}

const ListChangelogsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}