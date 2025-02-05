import { ActivepiecesError, apId, ApId, CreateProjectRoleRequestBody, ErrorCode, isNil, PlatformId, ProjectRole, RoleType, SeekPage, spreadIfDefined, UserWithProjectRole } from '@activepieces/shared'
import { Brackets, Equal } from 'typeorm'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { ProjectEntity } from '../../project/project-entity'
import { userRepo } from '../../user/user-service'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectRoleEntity } from './project-role.entity'


export const projectRoleRepo = repoFactory(ProjectRoleEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)
export const projectRepo = repoFactory(ProjectEntity)

export const projectRoleService = {

    async getOneOrThrowById({ id }: GetOneIdParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().findOneBy({ id })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: id, message: 'Project Role by id not found' },
            })
        }
        return projectRole
    },

    async getOne({ name, platformId }: GetOneByNameParams): Promise<ProjectRole | null> {
        return projectRoleRepo().createQueryBuilder('projectRole')
            .where('LOWER(projectRole.name) = LOWER(:name)', { name })
            .andWhere(new Brackets(qb => qb.where({ platformId }).orWhere({ type: RoleType.DEFAULT })))
            .getOne()
    },
    async getOneOrThrow({ name, platformId }: GetOneByNameParams): Promise<ProjectRole> {
        const projectRole = await this.getOne({ name, platformId })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: name, message: 'Project Role by name and platformId not found' },
            })
        }
        return projectRole
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ProjectRole>> {
        const projectRoles = await projectRoleRepo().find({
            where: [
                {
                    platformId: Equal(platformId),
                },
                {
                    type: RoleType.DEFAULT,
                },
            ],
            order: {
                created: 'ASC',
            },
        })

        return {
            data: await Promise.all(projectRoles.map(async (projectRole) => {
                return {
                    ...projectRole,
                    userCount: await projectMemberRepo().countBy({
                        platformId,
                        projectRoleId: projectRole.id,
                    }),
                }
            })),
            next: null,
            previous: null,
        }
    },

    async listPlatformUsersWithRoleAndProject({ platformId, filterProjectRoleId }: ListUsersWithProjectRolesParams): Promise<UserWithProjectRole[]> {
        const projectMembers = await projectMemberRepo().find({ 
            where: {
                platformId: Equal(platformId),
                projectRoleId: Equal(filterProjectRoleId),
            },
        })

        const usersWithProjectRoles = await Promise.all(projectMembers.map(async (projectMember) => {
            const user = await userRepo().findOneByOrFail({ id: projectMember.userId })
            const userIdentity = await userIdentityService(system.globalLogger()).getBasicInformation(user.identityId)
            const currentProject = await projectRepo().findOneByOrFail({ id: projectMember.projectId })
            const projectRole = await projectRoleRepo().findOneByOrFail({ id: projectMember.projectRoleId })
            return {
                id: projectMember.userId,
                firstName: userIdentity.firstName,
                lastName: userIdentity.lastName,
                email: userIdentity.email,
                projectRole,
                project: {
                    id: currentProject.id,
                    displayName: currentProject.displayName,
                },
            }
        }))
        return usersWithProjectRoles
    },

    async create(platformId: string, params: CreateProjectRoleRequestBody): Promise<ProjectRole> {
        const projectRoleExists = await this.getOne({
            name: params.name,
            platformId,
        })
        if (projectRoleExists) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: params.name, message: 'Project Role name already exists' },
            })
        }

        return projectRoleRepo().save({
            id: apId(),
            platformId,
            ...params,
        })
    },

    async update(params: UpdateParams): Promise<ProjectRole> {
        await projectRoleRepo().update({
            id: params.id,
            platformId: params.platformId,
        }, {
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('permissions', params.permissions),
        })
        return projectRoleRepo().findOneByOrFail({ id: params.id, platformId: params.platformId })
    },

    async delete({ name, platformId }: DeleteParams): Promise<void> {
        await projectRoleRepo().delete({ name, platformId })
    },
}

type UpdateParams = {
    id: ApId
    name: string | undefined
    platformId: PlatformId
    permissions: string[] | undefined
}

type ListParams = {
    platformId: PlatformId
}

type ListUsersWithProjectRolesParams = {
    platformId: PlatformId
    filterProjectRoleId: ApId
}

type DeleteParams = {
    name: ApId
    platformId: PlatformId
}

type GetOneByNameParams = {
    name: string
    platformId: PlatformId
}

type GetOneIdParams = {
    id: ApId
}