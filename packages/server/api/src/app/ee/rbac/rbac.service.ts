import { ActivepiecesError, ApId, apId, CreateRbacRequestBody, ErrorCode, PlatformId, ProjectMemberRole, Rbac, RoleType, SeekPage, spreadIfDefined, UpdateRbacRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { RbacEntity } from './rbac.entity'
import { rolePermissions } from '../../database/migration/postgres/1731424289830-CreateRbacTable'
import { ProjectMemberEntity } from '../project-members/project-member.entity'


export const rbacRepo = repoFactory(RbacEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)
export const rbacService = {

    async get(id: ApId, type?: RoleType): Promise<Rbac | null> {
        return rbacRepo().findOneBy({ id, type })
    },

    async getDefaultRoleByName(name: ProjectMemberRole): Promise<Rbac> {
        const role = await rbacRepo().findOneByOrFail({ name, type: RoleType.DEFAULT })
        return role
    },

    async list(platformId: PlatformId): Promise<SeekPage<Rbac>> {
        const rbacs = await rbacRepo().find({
            where: { platformId },
            order: { updated: 'DESC' },
        })

        for (const rbac of rbacs) {
            rbac.userCount = await projectMemberRepo().countBy({ roleId: rbac.id })
        }

        return {
            data: rbacs,
            next: null,
            previous: null,
        }
    },

    async create(params: CreateRbacRequestBody): Promise<Rbac> {
        const rbac = rbacRepo().create(params)
        rbac.id = apId()
        return rbacRepo().save(rbac)
    },

    async createDefaultRbac(platformId: PlatformId): Promise<void> {
        await rbacRepo().save(rbacRepo().create({
            id: apId(),
            name: ProjectMemberRole.ADMIN,
            permissions: rolePermissions[ProjectMemberRole.ADMIN],
            platformId,
            type: RoleType.DEFAULT,
        }))

        await rbacRepo().save(rbacRepo().create({
            id: apId(),
            name: ProjectMemberRole.EDITOR,
            permissions: rolePermissions[ProjectMemberRole.EDITOR],
            platformId,
            type: RoleType.DEFAULT,
        }))

        await rbacRepo().save(rbacRepo().create({
            id: apId(),
            name: ProjectMemberRole.OPERATOR,
            permissions: rolePermissions[ProjectMemberRole.OPERATOR],
            platformId,
            type: RoleType.DEFAULT,
        }))

        await rbacRepo().save(rbacRepo().create({
            id: apId(),
            name: ProjectMemberRole.VIEWER,
            permissions: rolePermissions[ProjectMemberRole.VIEWER],
            platformId,
            type: RoleType.DEFAULT,
        }))
    },

    async update(id: ApId, { name, permissions }: UpdateRbacRequestBody): Promise<Rbac> {
        const updateResult = await rbacRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('permissions', permissions),
        })

        if (updateResult.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'rbac',
                    entityId: id,
                },
            })
        }

        return rbacRepo().findOneByOrFail({ id })
    },

    async delete(id: ApId): Promise<void> {
        await rbacRepo().delete({ id })
    },
}
