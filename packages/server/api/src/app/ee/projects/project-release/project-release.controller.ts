import { ApId, ApplicationEventName, CreateProjectReleaseRequestBody, DiffReleaseRequest, ListProjectReleasesRequest, PrincipalType, ProjectRelease, SeekPage, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { platformService } from '../../../platform/platform.service'
import { ProjectReleaseEntity } from './project-release.entity'
import { projectReleaseService } from './project-release.service'

export const projectReleaseController: FastifyPluginAsyncZod = async (app) => {

    app.get('/:id', GetProjectReleaseRequest, async (req) => {
        const release = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId: req.projectId,
        })
        return projectReleaseService.enrich(release, req.log)
    })

    app.get('/', ListProjectReleasesRequestParams, async (req) => {
        return projectReleaseService.list({
            projectId: req.projectId,
            request: req.query,
            log: req.log,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        const platform = await platformService(req.log).getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        const release = await projectReleaseService.create({
            platformId: req.principal.platform.id,
            projectId: req.projectId,
            ownerId,
            params: req.body,
            log: req.log,
        })

        applicationEvents(req.log).sendUserEvent(req, {
            action: ApplicationEventName.PROJECT_RELEASE_CREATED,
            data: {
                release,
            },
        })
        return release
    })

    app.post('/diff', DiffProjectReleaseRequest, async (req) => {
        const platform = await platformService(req.log).getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        return projectReleaseService.releasePlan(req.projectId, ownerId, req.body, req.log)
    })
}

const GetProjectReleaseRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            undefined,
            {
                type: ProjectResourceType.TABLE,
                tableName: ProjectReleaseEntity,
            },
        ),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
    },
}

const ListProjectReleasesRequestParams = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            undefined,
            {
                type: ProjectResourceType.QUERY,
            },
        ),
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
        security: securityAccess.project(
            [PrincipalType.USER],
            undefined,
            {
                type: ProjectResourceType.BODY,
            },
        ),
    },
    schema: {
        body: DiffReleaseRequest,
    },
}

const CreateProjectReleaseRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            undefined,
            {
                type: ProjectResourceType.BODY,
            },
        ),
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