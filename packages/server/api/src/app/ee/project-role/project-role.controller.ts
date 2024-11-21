import { ApId, assertNotNullOrUndefined, CreateProjectRoleRequestBody, ProjectRole, RoleType, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectRoleService } from './project-role.service'

export const projectRoleController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', {}, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return projectRoleService.list(platformId)
    })

    app.post('/get/:id', GetProjectRoleRequest, async (req) => {
        return projectRoleService.get(req.params.id, req.body.type)
    })

    app.post('/', CreateProjectRoleRequest, async (req, reply) => {
        const result = await projectRoleService.create(req.body)
        return reply.code(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', UpdateProjectRoleRequest, async (req) => {
        return projectRoleService.update(req.params.id, req.body)
    })

    app.delete('/:id', DeleteProjectRoleRequest, async (req) => {
        return projectRoleService.delete(req.params.id)
    })
}

const GetProjectRoleRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: Type.Object({
            type: Type.Optional(Type.Enum(RoleType)),
        }),
    },
}

const CreateProjectRoleRequest = {
    schema: {
        body: CreateProjectRoleRequestBody,
        response: {
            [StatusCodes.CREATED]: ProjectRole,
        },
    },
}

const UpdateProjectRoleRequest = {
    schema: {
        body: UpdateProjectRoleRequestBody,
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: ProjectRole,
        },
    },
}

const DeleteProjectRoleRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}