import { ApId, assertNotNullOrUndefined, SeekPage } from '@activepieces/core-utils'
import { ApplicationEventName, CreateProjectReleaseRequestBody, DiffReleaseRequest, ListProjectReleasesRequest, PrincipalType, ProjectRelease, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { securityHelper } from '../../../helper/security-helper'
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
        const userId = await securityHelper.getUserIdFromRequest(req)
        assertNotNullOrUndefined(userId, 'userId')
        const release = await projectReleaseService.create({
            platformId: req.principal.platform.id,
            projectId: req.projectId,
            userId,
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
        const userId = await securityHelper.getUserIdFromRequest(req)
        assertNotNullOrUndefined(userId, 'userId')
        return projectReleaseService.releasePlan({
            projectId: req.projectId,
            userId,
            platformId: req.principal.platform.id,
            params: req.body,
            log: req.log,
        })
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