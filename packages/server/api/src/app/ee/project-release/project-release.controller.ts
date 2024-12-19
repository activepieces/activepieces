import { ApId, CreateProjectReleaseRequestBody, PrincipalType, ProjectRelease, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectReleaseService } from './project-release.service'

export const projectReleaseController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectReleasesRequest, async (req) => {
        return projectReleaseService.list({
            projectId: req.principal.projectId,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        return projectReleaseService.create({
            projectId: req.principal.projectId,
            importedBy: req.principal.id,
            name: req.body.name,
            description: req.body.description,
            log: req.log,
            type: req.body.type,
            repoId: req.body.repoId,
            selectedOperations: req.body.selectedOperations,
        })
    })

    app.post('/:id/download', DownloadProjectReleaseRequest, async (req) => {
        return projectReleaseService.download({
            id: req.params.id,
            projectId: req.principal.projectId,
            log: req.log,
        })
    })
}

const ListProjectReleasesRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectRelease),
        },
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

const DownloadProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}