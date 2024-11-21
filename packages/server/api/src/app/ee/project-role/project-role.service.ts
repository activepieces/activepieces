import { rolePermissions } from '@activepieces/ee-shared'
import { system } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApId, apId, CreateProjectRoleRequestBody, ErrorCode, PlatformId, ProjectMemberRole, ProjectRole, RoleType, SeekPage, spreadIfDefined, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectRoleEntity } from './project-role.entity'


export const projectRoleRepo = repoFactory(ProjectRoleEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)

const IS_COMMUNITY_EDITION = system.getEdition() === ApEdition.COMMUNITY

export const projectRoleService = {

    async get(id: ApId, type?: RoleType): Promise<ProjectRole | null> {
        return projectRoleRepo().findOneBy({ id, type })
    },

    async getDefaultRoleByName(name: ProjectMemberRole): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().findOneByOrFail({ name, type: RoleType.DEFAULT })
        return projectRole
    },

    async list(platformId: PlatformId): Promise<SeekPage<ProjectRole>> {
        const projectRoles = await projectRoleRepo().find({
            where: { platformId },
            order: { created: 'DESC' },
        })

        for (const projectRole of projectRoles) {
            projectRole.userCount = await projectMemberRepo().countBy({ projectRole: { id: projectRole.id } })
        }

        return {
            data: projectRoles,
            next: null,
            previous: null,
        }
    },

    async create(params: CreateProjectRoleRequestBody): Promise<ProjectRole> {
        const projectRole = projectRoleRepo().create(params)
        projectRole.id = apId()
        return projectRoleRepo().save(projectRole)
    },

    async createDefaultRbac(platformId: PlatformId): Promise<void> {
        if (IS_COMMUNITY_EDITION) {
            return
        }
        for (const projectRole of Object.values(ProjectMemberRole)) {
            await projectRoleRepo().save(projectRoleRepo().create({
                id: apId(),
                name: projectRole,
                permissions: rolePermissions[projectRole],
                platformId,
                type: RoleType.DEFAULT,
            }))
        }
    },

    async update(id: ApId, { name, permissions }: UpdateProjectRoleRequestBody): Promise<ProjectRole> {
        const updateResult = await projectRoleRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('permissions', permissions),
        })

        if (updateResult.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project_role',
                    entityId: id,
                },
            })
        }

        return projectRoleRepo().findOneByOrFail({ id })
    },

    async delete(id: ApId): Promise<void> {
        await projectRoleRepo().delete({ id })
    },
}
