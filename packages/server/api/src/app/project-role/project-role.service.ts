import { ActivepiecesError, ApId, CreateProjectRoleRequestBody, ErrorCode, isNil, ProjectRole, RoleType, SeekPage } from '@activepieces/shared'
import { Brackets } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { ProjectRoleEntity } from './project-role.entity'


export const projectRoleRepo = repoFactory(ProjectRoleEntity)

export const projectRoleService = {
    async getById({ id }: GetByIdParams): Promise<ProjectRole> {
        const projectRole = await projectRoleRepo().findOneBy({ id })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: id, message: 'Project role not found' },
            })
        }
        return projectRole
    },
    async getByNameAndPlatform({ name, platformId }: GetByNameParams): Promise<ProjectRole | null> {
        return projectRoleRepo()
            .createQueryBuilder('projectRole')
            .where('LOWER(projectRole.name) = LOWER(:name)', { name })
            .andWhere(new Brackets(qb => {
                qb.where('projectRole.platformId = :platformId', { platformId })
                    .orWhere('projectRole.type = :defaultType', { defaultType: RoleType.DEFAULT })
            }))
            .getOne()
    },
    async getByNameAndPlatformOrThrow({ name, platformId }: GetByNameParams): Promise<ProjectRole> {
        const projectRole = await this.getByNameAndPlatform({ name, platformId })
        if (isNil(projectRole)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_role', entityId: name, message: 'Project role not found' },
            })
        }
        return projectRole
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ProjectRole>> {
        // Return roles either for the given platform OR globally defined default roles
        const projectRoles = await projectRoleRepo().find({
            where: [
                { platformId },
                { type: RoleType.DEFAULT },
            ],
            order: { created: 'ASC' },
        })

        // UI expects a paginated response format
        return {
            data: projectRoles,
            next: null,
            previous: null
        }
    },
    async create(_params: CreateParams): Promise<void> {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'Cannot create project role' },
        })
    },
    async update(_params: UpdateParams): Promise<void> {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'Cannot update project role' },
        })
    },
    async delete(_params: DeleteParams): Promise<void> {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'Cannot delete project role' },
        })
    },
}

type CreateParams = CreateProjectRoleRequestBody & {
    platformId: ApId
}

type UpdateParams = {
    id: ApId
    platformId: ApId
    name: string | undefined
    permissions: string[] | undefined
}

type ListParams = {
    platformId: ApId
}

type DeleteParams = {
    name: ApId
    platformId: ApId
}

type GetByNameParams = {
    name: string
    platformId: ApId
}

type GetByIdParams = {
    id: ApId
}
