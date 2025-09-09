import { ApId, CreateProjectReleaseRequestBody, DiffReleaseRequest, ListProjectReleasesRequest, PrincipalType, ProjectRelease, SeekPage, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { projectReleaseService } from './project-release.service'

export const projectReleaseController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/:id', GetProjectReleaseRequest, async (req) => {
        const release = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        return projectReleaseService.enrich(release)
    })

    app.get('/', ListProjectReleasesRequestParams, async (req) => {
        return projectReleaseService.list({
            projectId: req.principal.projectId,
            request: req.query,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        const platform = await platformService.getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        const release = await projectReleaseService.create({
            platformId: req.principal.platform.id,
            projectId: req.principal.projectId,
            ownerId,
            params: req.body,
            log: req.log,
        })

        return release
    })

    app.post('/diff', DiffProjectReleaseRequest, async (req) => {
        const platform = await platformService.getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        return projectReleaseService.releasePlan(req.principal.projectId, ownerId, req.body, req.log)
    })
}

const GetProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListProjectReleasesRequestParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: DiffReleaseRequest,
    },
}

const CreateProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
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