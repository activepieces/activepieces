import {
    ActivepiecesError,
    ApEdition,
    ApId,
    ErrorCode,
    FlowOperationType,
    isNil,
    Permission,
    Principal,
    PrincipalType,
    ProjectId,
    ProjectRole,
    UserPrincipal,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { projectMemberService } from '../../projects/project-members/project-member.service'
import { projectRoleService } from '../../projects/project-role/project-role.service'

export const rbacService = (log: FastifyBaseLogger) => ({
    async assertPrinicpalAccessToProject({ principal, permission, projectId }: AssertRoleHasPermissionParams): Promise<void> {

        switch (principal.type) {
            case PrincipalType.UNKNOWN:
            case PrincipalType.WORKER:
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'Principal is not allowed to access this project',
                        projectId,
                    },
                })

            case PrincipalType.USER: {
                const principalRole = await getPrincipalRoleOrThrow({ principal, projectId, log })
                const access = await grantAccess({
                    principalRoleId: principalRole.id,
                    routePermission: permission,
                })

                if (!access) {
                    throwPermissionDenied({ principal, projectId, projectRole: principalRole, permission })
                }
                break
            }
            case PrincipalType.ENGINE: {
                if (principal.projectId !== projectId) {
                    throw new ActivepiecesError({
                        code: ErrorCode.AUTHORIZATION,
                        params: {
                            message: 'Engine is not allowed to access this project',
                            projectId,
                            engineProjectId: principal.projectId,
                        },
                    })
                }
                break
            }
            case PrincipalType.SERVICE: {
                const project = await projectService.getOneOrThrow(projectId)
                if (project.platformId !== principal.platform.id) {
                    throw new ActivepiecesError({
                        code: ErrorCode.AUTHORIZATION,
                        params: {
                            message: 'Service is not allowed to access this project',
                            projectId,
                            platformId: principal.platform.id,
                        },
                    })
                }
                break
            }
        }
    },
    async assertUserHasPermissionToFlow({ principal, operationType, projectId }: AssertUserHasPermissionToFlowParams): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }

        switch (operationType) {
            case FlowOperationType.LOCK_AND_PUBLISH:
            case FlowOperationType.CHANGE_STATUS: {
                await this.assertPrinicpalAccessToProject({ principal, permission: Permission.UPDATE_FLOW_STATUS, projectId })
                break
            }
            case FlowOperationType.UPDATE_MINUTES_SAVED: 
            case FlowOperationType.SAVE_SAMPLE_DATA:
            case FlowOperationType.ADD_ACTION:
            case FlowOperationType.UPDATE_ACTION:
            case FlowOperationType.DELETE_ACTION:
            case FlowOperationType.LOCK_FLOW:
            case FlowOperationType.CHANGE_FOLDER:
            case FlowOperationType.CHANGE_NAME:
            case FlowOperationType.MOVE_ACTION:
            case FlowOperationType.IMPORT_FLOW:
            case FlowOperationType.UPDATE_TRIGGER:
            case FlowOperationType.DUPLICATE_ACTION:
            case FlowOperationType.USE_AS_DRAFT:
            case FlowOperationType.ADD_BRANCH:
            case FlowOperationType.DELETE_BRANCH:
            case FlowOperationType.DUPLICATE_BRANCH:
            case FlowOperationType.UPDATE_METADATA:
            case FlowOperationType.SET_SKIP_ACTION:
            case FlowOperationType.MOVE_BRANCH: {
                await this.assertPrinicpalAccessToProject({ principal, permission: Permission.WRITE_FLOW, projectId })
                break
            }
        }
    },
})

const getPrincipalRoleOrThrow = async ({ principal, projectId, log }: GetPrincipalRoleOrThrowParams): Promise<ProjectRole> => {
    const { id: userId } = principal

    const projectRole = await projectMemberService(log).getRole({
        projectId,
        userId,
    })

    if (isNil(projectRole)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'No role found for the user',
                userId,
                projectId,
            },
        })
    }

    return projectRole
}

const grantAccess = async ({ principalRoleId, routePermission }: GrantAccessArgs): Promise<boolean> => {
    if (isNil(routePermission)) {
        return true
    }

    const principalRole = await projectRoleService.getOneOrThrowById({
        id: principalRoleId,
    })

    if (isNil(principalRole)) {
        return false
    }

    return principalRole.permissions?.includes(routePermission)
}

const throwPermissionDenied = ({ principal, projectId, projectRole, permission }: ThrowPermissionDeniedParams): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            userId: principal.id,
            projectId,
            projectRole,
            permission,
        },
    })
}

type GrantAccessArgs = {
    principalRoleId: ApId
    routePermission: Permission | undefined
}

type AssertRoleHasPermissionParams = {
    principal: Principal
    permission: Permission | undefined
    projectId: ProjectId
}

type GetPrincipalRoleOrThrowParams = {
    principal: UserPrincipal
    projectId: ProjectId
    log: FastifyBaseLogger
}

type ThrowPermissionDeniedParams = {
    principal: UserPrincipal
    projectId: ProjectId
    projectRole: ProjectRole
    permission: Permission | undefined
}

type AssertUserHasPermissionToFlowParams = {
    principal: Principal
    operationType: FlowOperationType
    projectId: ProjectId
}