import { ActivepiecesError, ApId, apId, CreateProjectRoleRequestBody, ErrorCode, isNil, PlatformId, ProjectMemberRole, ProjectRole, RoleType, SeekPage, spreadIfDefined } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectRoleEntity } from './project-role.entity'


export const projectRoleRepo = repoFactory(ProjectRoleEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const projectRoleService = {

    async get({ id, platformId }: GetOneParams): Promise<ProjectRole | null> {
        return projectRoleRepo().findOneBy({ id, platformId })
    },
    async getOneOrThrow({ id, platformId }: GetOneParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().findOneBy({ id, platformId })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: id },
            })
        }
        return projectRole
    },
    async getDefaultRoleByName({ name }: GetOneByNameOrThrowParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().findOneBy({ name, type: RoleType.DEFAULT })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: name },
            })
        }
        return projectRole
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ProjectRole>> {
        const projectRoles = await projectRoleRepo().find({
            where: {
                platformId,
            },
            order: {
                created: 'DESC',
            },
        })

        return {
            data: await Promise.all(projectRoles.map(async (projectRole) => {
                return {
                    ...projectRole,
                    userCount: await projectMemberRepo().countBy({ projectRole: { id: projectRole.id } }),
                }
            })),
            next: null,
            previous: null,
        }
    },

    async create(params: CreateProjectRoleRequestBody): Promise<ProjectRole> {
        const projectRole = projectRoleRepo().create(params)
        projectRole.id = apId()
        return projectRoleRepo().save(projectRole)
    },

    async update(params: UpdateParams): Promise<ProjectRole> {
        await projectRoleRepo().update({
            id: params.id,
            platformId: params.platformId,
        }, {
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('permissions', params.permissions),
        })
        return this.getOneOrThrow({ id: params.id, platformId: params.platformId })
    },

    async delete({ id, platformId }: DeleteParms): Promise<void> {
        await projectRoleRepo().delete({ id, platformId })
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

type DeleteParms = {
    id: ApId
    platformId: PlatformId
}


type GetOneByNameOrThrowParams = {
    name: ProjectMemberRole
}

type GetOneParams = {
    platformId: PlatformId
    id: ApId
}