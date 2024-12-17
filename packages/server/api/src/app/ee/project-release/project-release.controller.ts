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

    app.post('/', CreateProjectReleaseRequest, async (req, res) => {
        const projectRelease = await projectReleaseService.create({
            projectId: req.principal.projectId,
            fileId: req.body.fileId,
            importedBy: req.principal.id,
            name: req.body.name,
            description: req.body.description,
        })
        return res.status(StatusCodes.CREATED).send(projectRelease)
        // TODO: we should audit log this event
    })

    app.delete('/:id', DeleteProjectReleaseRequest, async (req, res) => {
        await projectReleaseService.delete({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        return res.status(StatusCodes.NO_CONTENT).send()
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

const DeleteProjectReleaseRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}