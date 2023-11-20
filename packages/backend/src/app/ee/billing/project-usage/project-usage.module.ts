import { ListProjectUsageRequest } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectUsageService } from './project-usage-service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { assertNotNullOrUndefined } from '@activepieces/shared'

export const projectUsageModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)
    await app.register(projectUsageController, { prefix: '/v1/project-usages' })
}


const projectUsageController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', {
        schema: {
            querystring: ListProjectUsageRequest,
        },
    }, async (request) => {
        const platformId = request.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return projectUsageService.list({
            filterByProjectIds: request.query.projectIds ?? null,
            platformId,
        })
    })

}
