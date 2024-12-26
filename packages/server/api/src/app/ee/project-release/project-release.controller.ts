import { ApId, CreateProjectReleaseRequestBody, DiffReleaseRequest, FileType, ListProjectReleasesRequest, PrincipalType, ProjectRelease, ProjectReleaseType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { fileService } from '../../file/file.service'
import { platformService } from '../../platform/platform.service'
import { projectReleaseService } from './project-release.service'

export const projectReleaseController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectReleasesRequestParams, async (req) => {
        return projectReleaseService.list({
            projectId: req.principal.projectId,
            request: req.query,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        const platform = await platformService.getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        return projectReleaseService.create(req.principal.projectId, ownerId, req.principal.id, req.body, req.log)
    })

    app.post('/diff', DiffProjectReleaseRequest, async (req) => {
        const platform = await platformService.getOneOrThrow(req.principal.platform.id)
        const ownerId = platform.ownerId
        return projectReleaseService.releasePlan(req.principal.projectId, ownerId, req.body, req.log)
    })

    app.post('/:id/export', ExportProjectReleaseRequest, async (req) => {
        const projectRelease = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        const file = await fileService(req.log).getDataOrThrow({
            fileId: projectRelease.fileId,
            projectId: projectRelease.projectId,
            type: FileType.PROJECT_RELEASE,
        })
        return JSON.parse(file.data.toString())
    })
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
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: CreateProjectReleaseRequestBody,
        response: {
            [StatusCodes.CREATED]: ProjectRelease,
        },
    },
}

const ExportProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}