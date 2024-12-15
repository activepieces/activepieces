import { ApId, CreateProjectVersionRequestBody, ProjectVersion, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectVersionService } from './project-version.service'

export const projectVersionController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectVersionsRequest, async (req) => {
        return projectVersionService.list({
            projectId: req.principal.projectId,
        })
    })

    app.post('/', CreateProjectVersionRequest, async (req, res) => {
        const projectVersion = await projectVersionService.create({
            projectId: req.principal.projectId,
            fileId: req.body.fileId,
            importedBy: req.principal.id,
        })
        return res.status(StatusCodes.CREATED).send(projectVersion)
        // TODO: we should audit log this event
    })

    app.delete('/:id', DeleteProjectVersionRequest, async (req, res) => {
        await projectVersionService.delete({
            id: req.params.id,
            projectId: req.principal.projectId,
        })
        return res.status(StatusCodes.NO_CONTENT).send()
    })

}

const ListProjectVersionsRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectVersion),
        },
    },
}

const CreateProjectVersionRequest = {
    schema: {
        body: CreateProjectVersionRequestBody,
        response: {
            [StatusCodes.CREATED]: ProjectVersion,
        },
    },
}

const DeleteProjectVersionRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}