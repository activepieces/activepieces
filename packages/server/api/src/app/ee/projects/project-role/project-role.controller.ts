import { ProjectMemberWithUser } from '@activepieces/ee-shared'
import { ApId, CreateProjectRoleRequestBody, ListProjectMembersForProjectRoleRequestQuery, Permission, PrincipalType, ProjectRole, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../../authentication/ee-authorization'
import { projectMemberService } from '../project-members/project-member.service'
import { projectRoleService } from './project-role.service'

const DEFAULT_LIMIT_SIZE = 10

export const projectRoleController: FastifyPluginAsyncTypebox = async (app) => {
    
    app.get('/:id', GetProjectRoleRequest, async (req) => {
        return projectRoleService.getOneOrThrowById({
            id: req.params.id,
        })
    })

    app.get('/:id/project-members', ListProjectMembersForProjectRoleRequest, async (req) => {
        return projectMemberService(req.log).list({
            projectRoleId: req.params.id,
            platformId: req.principal.platform.id,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? DEFAULT_LIMIT_SIZE,
        })
    })

    app.get('/', ListProjectRolesRequest, async (req) => {
        return projectRoleService.list({
            platformId: req.principal.platform.id,
        })
    })

    app.post('/', CreateProjectRoleRequest, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        await platformMustHaveFeatureEnabled((platform) => platform.plan.customRolesEnabled).call(app, req, reply)
        const projectRole = await projectRoleService.create(req.principal.platform.id, req.body)

        return reply.code(StatusCodes.CREATED).send(projectRole)
    })

    app.post('/:id', UpdateProjectRoleRequest, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        await platformMustHaveFeatureEnabled((platform) => platform.plan.customRolesEnabled).call(app, req, reply)
        const projectRole = await projectRoleService.update({
            id: req.params.id,
            platformId: req.principal.platform.id,
            name: req.body.name,
            permissions: req.body.permissions,
        })
        return projectRole
    })

    app.delete('/:name', DeleteProjectRoleRequest, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        await platformMustHaveFeatureEnabled((platform) => platform.plan.customRolesEnabled).call(app, req, reply)
        
        return projectRoleService.delete({
            name: req.params.name,
            platformId: req.principal.platform.id,
        })
    })
}

const GetProjectRoleRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListProjectRolesRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectRole),
        },
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
            name: Type.String(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}

const ListProjectMembersForProjectRoleRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_PROJECT_MEMBER,
    },
    schema: {
        tags: ['project-members'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        querystring: ListProjectMembersForProjectRoleRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectMemberWithUser),
        },
    },
}