import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    ApId,
    CreateProjectReleaseRequestBody,
    DiffReleaseRequest,
    ListProjectReleasesRequest,
    Permission,
    PrincipalType,
    ProjectRelease,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { eventsHooks } from '../../../helper/application-events'
import { platformService } from '../../../platform/platform.service'
import { projectReleaseService } from './project-release.service'
import { AuthorizationType, projectAccess, ProjectResourceType, RouteKind } from '@activepieces/server-shared'
import { ProjectReleaseEntity } from './project-release.entity'

export const projectReleaseController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/:id', GetProjectReleaseRequest, async (req) => {
        const projectId = req.principal.projectId
        const release = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId,
        })
        return projectReleaseService.enrich(release)
    })

    app.get('/', ListProjectReleasesRequestParams, async (req) => {
        return projectReleaseService.list({
            projectId: req.query.projectId,
            request: req.query,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        const platformId = req.principal.platformId
        const projectId = req.principal.projectId
        const platform = await platformService.getOneOrThrow(platformId)
        const ownerId = platform.ownerId
        const release = await projectReleaseService.create({
            platformId,
            projectId,
            ownerId,
            params: req.body,
            log: req.log,
        })

        eventsHooks.get(req.log).sendUserEventFromRequest(req, {
            action: ApplicationEventName.PROJECT_RELEASE_CREATED,
            data: {
                release,
            },
        })
        return release
    })

    app.post('/diff', DiffProjectReleaseRequest, async (req) => {
        const platformId = req.principal.platformId
        const projectId = req.principal.projectId
        const platform = await platformService.getOneOrThrow(platformId)
        const ownerId = platform.ownerId
        return projectReleaseService.releasePlan(projectId, ownerId, req.body, req.log)
    })
}

const GetProjectReleaseRequest = {
    config: {
        security: projectAccess([PrincipalType.USER], Permission.READ_PROJECT_RELEASE, {
            type: ProjectResourceType.TABLE,
            tableName: ProjectReleaseEntity,
        }),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListProjectReleasesRequestParams = {
    config: {
        security: projectAccess([PrincipalType.USER], Permission.READ_PROJECT_RELEASE, {
            type: ProjectResourceType.QUERY
        }),
    },
    schema: {
        querystring: ListProjectReleasesRequest,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectRelease),
        },
    },
}

const DiffProjectReleaseRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                permission: Permission.READ_PROJECT_RELEASE,
                projectResource: {
                    type: ProjectResourceType.BODY,
                },
            },
        } as const,
    },
    schema: {
        body: DiffReleaseRequest,
    },
}

const CreateProjectReleaseRequest = {
    config: {
        security: projectAccess([PrincipalType.USER, PrincipalType.SERVICE] as const, Permission.WRITE_PROJECT_RELEASE, {
            type: ProjectResourceType.BODY
        }),
    },
    schema: {
        tags: ['project-releases'],
        body: CreateProjectReleaseRequestBody,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.CREATED]: ProjectRelease,
        },
    },
}