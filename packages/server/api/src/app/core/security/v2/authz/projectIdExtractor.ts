import { EntitySourceType, ProjectBodyResource, ProjectParamResource, ProjectQueryResource, ProjectTableResource } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil, isObject } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../../../../database/database-connection'

export const projectIdExtractor = {
    async fromTable(
        request: FastifyRequest,
        projectTableResource: ProjectTableResource,
    ): Promise<string | undefined> {
        const entitySourceType = projectTableResource.entitySourceType ?? EntitySourceType.PARAM
        let entityValue: string | undefined
        const { paramKey, entityField } = projectTableResource.lookup ?? {
            paramKey: 'id',
            entityField: 'id',
        }

        switch (entitySourceType) {
            case EntitySourceType.PARAM:
                entityValue = entityValueExtractor.fromParam(request, paramKey)
                break
            case EntitySourceType.QUERY:
                entityValue = entityValueExtractor.fromQuery(request, paramKey)
                break
            case EntitySourceType.BODY:
                entityValue = entityValueExtractor.fromBody(request, paramKey)
        }
        if (isNil(entityValue)) {
            return undefined
        }
        const entity = await databaseConnection().getRepository(projectTableResource.tableName).findOneBy({
            [entityField]: entityValue,
        })
        return entity?.projectId ?? entity?.projectIds?.[0] ?? undefined
    },

    fromBody(request: FastifyRequest, projectBodyResource: ProjectBodyResource): string | undefined {
        const key = projectBodyResource.bodyKey ?? 'projectId'
        if (isObject(request.body) && key in request.body) {
            return request.body[key] as string
        }

        return undefined
    },

    fromQuery(request: FastifyRequest, projectQueryResource: ProjectQueryResource): string | undefined {
        const key = projectQueryResource.queryKey ?? 'projectId'
        if (isObject(request.query) && key in request.query) {
            return request.query[key] as string
        }

        return undefined
    },

    async fromParam(request: FastifyRequest, projectParamResource: ProjectParamResource): Promise<string | undefined> {
        const key = projectParamResource.paramKey ?? 'projectId'
        const { [key]: paramValue } = request.params as Record<string, string>
        return paramValue ?? undefined
    },
}

const entityValueExtractor = {
    fromParam(request: FastifyRequest, paramKey: string): string | undefined {
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined')
        const hasIdParam = routerPath.includes(`:${paramKey}`) &&
          isObject(request.params) &&
          paramKey in request.params &&
          typeof request.params[paramKey] === 'string'

        if (!hasIdParam) {
            return undefined
        }

        const { [paramKey]: paramValue } = request.params as Record<string, string>
        return paramValue
    },

    fromQuery(request: FastifyRequest, key: string): string | undefined {
        if (isObject(request.query) && key in request.query) {
            return request.query[key] as string
        }
        return undefined
    },

    fromBody(request: FastifyRequest, key: string): string | undefined {
        if (isObject(request.body) && key in request.body) {
            return request.body[key] as string
        }
        return undefined
    },
}