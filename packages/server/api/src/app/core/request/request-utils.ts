import { assertNotNullOrUndefined, isObject } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import { ProjectBodyResource, ProjectQueryResource, ProjectTableResource } from '@activepieces/server-shared'

export const requestUtils = {

    async extractProjectIdFromTable(
        request: FastifyRequest,
        projectTableResource: ProjectTableResource,
    ): Promise<string | undefined> {
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined')   

        const hasIdParam = routerPath.includes(':id') &&
            isObject(request.params) &&
            'id' in request.params &&
            typeof request.params.id === 'string'

        if (!hasIdParam) {
            return undefined
        }
        
        const { id } = request.params as { id: string }
        
        const entity = await databaseConnection().getRepository(projectTableResource.tableName).findOneBy({
            id,
        })
        return entity?.projectId ?? undefined
    },

    extractProjectIdFromBody(request: FastifyRequest, projectBodyResource: ProjectBodyResource): string | undefined {
        if (isObject(request.body) && projectBodyResource.key in request.body) {
            return request.body[projectBodyResource.key] as string
        }

        return undefined
    },

    extractProjectIdFromQuery(request: FastifyRequest, projectQueryResource: ProjectQueryResource): string | undefined {
        if (isObject(request.query) && projectQueryResource.key in request.query) {
            return request.query[projectQueryResource.key] as string
        }

        return undefined
    },
}