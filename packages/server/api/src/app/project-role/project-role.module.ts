import { ApId, ListProjectMembersForProjectRoleRequestQuery, ProjectMember, ProjectRole, SeekPage, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectRoleService } from './project-role.service'
import { projectMemberService } from '../project-member/project-member.service'

const ListProjectRolesRequest = {
    config: {},
    schema: {
        tags: ['project-role'],
        response: {
            [StatusCodes.OK]: SeekPage(ProjectRole),
        }
    }
}

const GetProjectRoleRequest = {
    schema: {
        tags: ['project-role'],
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ProjectMembersForProjectRoleRequest = {
    schema: {
        tags: ['project-member'],
        params: Type.Object({
            id: ApId,
        }),
        querystring: ListProjectMembersForProjectRoleRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectMember),
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
            name: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}

export const projectRoleModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectRoleController, { prefix: '/v1/project-roles' })
}

const projectRoleController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListProjectRolesRequest, async (request) => {
        return projectRoleService.list({
            platformId: request.principal.platform.id,
        })
    })

    app.get('/:id', GetProjectRoleRequest, async (req) => {
        return projectRoleService.getById({
            id: req.params.id,
        })
    })

    app.get('/:id/project-members', ProjectMembersForProjectRoleRequest, async (req) => {
        return projectMemberService.list({
            projectRoleId: req.params.id,
            platformId: req.principal.platform.id,
            cursorRequest: req.query.cursor || null,
            limit: req.query.limit ?? 1000,
        })
    })

    app.post('/:id', UpdateProjectRoleRequest, async (req) => {
        const projectRole = await projectRoleService.update({
            id: req.params.id,
            platformId: req.principal.platform.id,
            name: req.body.name,
            permissions: req.body.permissions,
        })
        return projectRole
    })

    app.delete('/:name', DeleteProjectRoleRequest, async (req) => {
        await projectRoleService.getByNameAndPlatformOrThrow({
            name: req.params.name,
            platformId: req.principal.platform.id,
        })
        return projectRoleService.delete({
            name: req.params.name,
            platformId: req.principal.platform.id,
        })
    })
}
