import { ApId, CreateProjectReleaseRequestBody, FileType, ListProjectReleasesRequest, PrincipalType, ProjectRelease, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { fileService } from '../../file/file.service'
import { projectDiffService } from './project-diff/project-diff.service'
import { projectReleaseService } from './project-release.service'
import { projectStateService } from './project-state/project-state.service'

export const projectReleaseController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectReleasesRequestParams, async (req) => {
        return projectReleaseService.list({
            projectId: req.principal.projectId,
            request: req.query,
        })
    })

    app.post('/', CreateProjectReleaseRequest, async (req) => {
        return projectReleaseService.create({
            ...req.body,
            description: req.body.description ?? null,
            projectId: req.principal.projectId,
            importedBy: req.principal.id,
            log: req.log,
        })
    })
    
    app.post('/:id/apply', ApplyProjectReleaseRequest, async (req) => {
        const projectRelease = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        const newState = await projectStateService(req.log).getNewState(projectRelease.projectId, projectRelease.fileId, req.log)
        const oldState = await projectStateService(req.log).getCurrentState(projectRelease.projectId, req.log)
        const mapping = await projectStateService(req.log).getMappingState(projectRelease.projectId, newState, oldState)
        const operations = projectDiffService.diff({
            newState,
            oldState,
            mapping,
        })
        return projectStateService(req.log).apply({
            projectId: projectRelease.projectId,
            operations,
            mappingState: mapping,
        })
    })

    app.post('/:id/download', DownloadProjectReleaseRequest, async (req) => {
        const projectRelease = await projectReleaseService.getOneOrThrow({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        const file = await fileService(req.log).getDataOrThrow({
            fileId: projectRelease.fileId,
            projectId: projectRelease.projectId,
            type: FileType.PROJECT_RELEASE,
        })
        return file.data
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

const ApplyProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
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