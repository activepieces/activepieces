import { ActivepiecesError, apId, ApId, CreateProjectRoleRequestBody, ErrorCode, isNil, PlatformId, ProjectRole, RoleType, SeekPage, spreadIfDefined } from '@activepieces/shared'
import { Brackets, Equal } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectRoleEntity } from './project-role.entity'


export const projectRoleRepo = repoFactory(ProjectRoleEntity)
export const projectMemberRepo = repoFactory(ProjectMemberEntity)

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
                    userCount: await projectMemberRepo().countBy({ projectRoleId: projectRole.id }),
                }
            })),
            next: null,
            previous: null,
        }
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