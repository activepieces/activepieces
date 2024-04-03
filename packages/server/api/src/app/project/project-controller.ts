import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from './project-service'

export const projectController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.get('/', async (request) => {
        return paginationHelper.createPage(
            [await projectService.getUserProjectOrThrow(request.principal.id)],
            null,
        )
    })

    done()
}
