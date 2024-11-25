import { ActivepiecesError, apId, ApId, CreateProjectRoleRequestBody, DefaultProjectRole, ErrorCode, isNil, PlatformId, ProjectRole, RoleType, SeekPage, spreadIfDefined } from '@activepieces/shared'
import { Brackets } from 'typeorm'
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

    async get({ id, platformId }: GetOneParams): Promise<ProjectRole | null> {
        return projectRoleRepo().findOneBy({ id, platformId })
    },
    async getOneOrThrow({ name, platformId }: GetOneByNameParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().createQueryBuilder('projectRole')
            .where('LOWER(projectRole.name) = LOWER(:name)', { name })
            .andWhere(new Brackets(qb => {
                qb.where('projectRole.platformId = :platformId', { platformId })
                    .orWhere('projectRole.platformId IS NULL')
            }))
            .getOne()

        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: name, message: 'Project Role by name and platformId not found' },
            })
        }
        return projectRole
    },
    async getDefaultRoleByName({ name }: GetOneByNameOrThrowParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().createQueryBuilder('projectRole')
            .where('LOWER(projectRole.name) = LOWER(:name)', { name })
            .andWhere('projectRole.type = :type', { type: RoleType.DEFAULT })
            .getOne()
            
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: name, message: 'Project Role by name not found' },
            })
        }
        return projectRole
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ProjectRole>> {
        const projectRoles = await projectRoleRepo().find({
            where: [
                { platformId },
                { type: RoleType.DEFAULT },
            ],
            order: {
                created: 'DESC',
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

    async create(params: CreateProjectRoleRequestBody): Promise<ProjectRole> {
        const projectNameExists = await projectRoleRepo().createQueryBuilder('projectRole')
            .where('LOWER(projectRole.name) = LOWER(:name)', { name: params.name })
            .andWhere('projectRole.platformId = :platformId', { platformId: params.platformId })
            .getOne()
            
        if (projectNameExists) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: params.name, message: 'Project Role name already exists' },
            })
        }

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


type GetOneByNameOrThrowParams = {
    name: DefaultProjectRole
}

type GetOneParams = {
    platformId: PlatformId
    id: ApId
}

type GetOneByNameParams = {
    name: string
    platformId: PlatformId
}

type GetOneIdParams = {
    id: ApId
}