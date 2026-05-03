import {
    ListPlatformAppConnectionsRequestQuery,
    PlatformAppConnectionOwner,
    PlatformAppConnectionProjectInfo,
    PlatformAppConnectionsListItem,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    unique,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { In } from 'typeorm'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { projectRepo } from '../project/project-service'
import { appConnectionService, appConnectionsRepo } from './app-connection-service/app-connection-service'

export const platformAppConnectionController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListPlatformAppConnectionsRequest, async (request): Promise<SeekPage<PlatformAppConnectionsListItem>> => {
        const platformId = request.principal.platform.id
        const { displayName, pieceName, status, scope, cursor, limit, projectIds, ownerIds } = request.query

        const appConnections = await appConnectionService(request.log).list({
            pieceName,
            displayName,
            status,
            scope,
            platformId,
            projectId: null,
            projectIds,
            ownerIds,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
            externalIds: undefined,
        })

        const projectIdsToLookUp = unique(appConnections.data.flatMap((connection) => connection.projectIds))
        const projectsById = await fetchProjectsForPlatform(projectIdsToLookUp, platformId)

        const data: PlatformAppConnectionsListItem[] = appConnections.data.map((connection) => {
            const sanitized = appConnectionService(request.log).removeSensitiveData(connection)
            const projects: PlatformAppConnectionProjectInfo[] = connection.projectIds
                .map((id) => projectsById.get(id))
                .filter((project): project is PlatformAppConnectionProjectInfo => project !== undefined)
            return { ...sanitized, projects }
        })

        return { ...appConnections, data }
    })

    app.get('/owners', ListPlatformAppConnectionOwnersRequest, async (request): Promise<SeekPage<PlatformAppConnectionOwner>> => {
        const platformId = request.principal.platform.id
        const owners = await appConnectionsRepo()
            .createQueryBuilder('app_connection')
            .innerJoin('app_connection.owner', 'owner')
            .innerJoin('owner.identity', 'identity')
            .where('app_connection.platformId = :platformId', { platformId })
            .select('owner.id', 'id')
            .addSelect('identity.firstName', 'firstName')
            .addSelect('identity.lastName', 'lastName')
            .addSelect('identity.email', 'email')
            .distinct(true)
            .orderBy('identity.email', 'ASC')
            .getRawMany<PlatformAppConnectionOwner>()

        return { data: owners, next: null, previous: null }
    })
}

const DEFAULT_PAGE_SIZE = 10

const fetchProjectsForPlatform = async (projectIds: string[], platformId: string): Promise<Map<string, PlatformAppConnectionProjectInfo>> => {
    if (projectIds.length === 0) {
        return new Map()
    }
    const projects = await projectRepo().find({
        where: { id: In(projectIds), platformId },
        select: ['id', 'displayName'],
    })
    return new Map(projects.map((project) => [project.id, { id: project.id, displayName: project.displayName }]))
}

const ListPlatformAppConnectionsRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platform-app-connections'],
        querystring: ListPlatformAppConnectionsRequestQuery,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List app connections across every project on the platform',
        response: {
            [StatusCodes.OK]: SeekPage(PlatformAppConnectionsListItem),
        },
    },
}

const ListPlatformAppConnectionOwnersRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platform-app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List distinct connection owners across every project on the platform',
        response: {
            [StatusCodes.OK]: SeekPage(PlatformAppConnectionOwner),
        },
    },
}
