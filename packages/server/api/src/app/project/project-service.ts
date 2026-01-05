import { getProjectMaxConcurrentJobsKey } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId,
    apId,
    assertNotNullOrUndefined,
    ColorName,
    ErrorCode,
    isNil,
    Metadata,
    Project,
    ProjectIcon,
    ProjectId,
    ProjectType,
    spreadIfDefined,
    UserId,
} from '@activepieces/shared'
import { Brackets, IsNull, Not, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { distributedStore } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { userService } from '../user/user-service'
import { ProjectEntity } from './project-entity'
import { projectHooks } from './project-hooks'

export const projectRepo = repoFactory(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {
        const colors = Object.values(ColorName)
        const icon: ProjectIcon = {
            color: colors[Math.floor(Math.random() * colors.length)],
        }
        const newProject: NewProject = {
            id: apId(),
            ...params,
            icon,
            maxConcurrentJobs: params.maxConcurrentJobs,
            releasesEnabled: false,
        }
        const savedProject = await projectRepo().save(newProject)
        await projectHooks.get(system.globalLogger()).postCreate(savedProject)
        if (!isNil(params.maxConcurrentJobs)) {
            await distributedStore.put(getProjectMaxConcurrentJobsKey(savedProject.id), params.maxConcurrentJobs)
        }
        return savedProject
    },
    async getOneByOwnerAndPlatform(params: GetOneByOwnerAndPlatformParams): Promise<Project | null> {
        return projectRepo().findOneBy({
            ownerId: params.ownerId,
            platformId: params.platformId,
        })
    },

    async getOne(projectId: ProjectId | undefined): Promise<Project | null> {
        if (isNil(projectId)) {
            return null
        }

        return projectRepo().findOneBy({
            id: projectId,
        })
    },

    async getProjectIdsByPlatform(platformId: string): Promise<string[]> {
        const projects = await projectRepo()
            .createQueryBuilder('project')
            .select('project.id')
            .where({ platformId })
            .orderBy('project.type', 'ASC')
            .addOrderBy('project.displayName', 'ASC')
            .addOrderBy('project.id', 'ASC')
            .getMany()

        return projects.map((project) => project.id)
    },

    async countByPlatformIdAndType(platformId: string, type: ProjectType): Promise<number> {
        return projectRepo().countBy({
            platformId,
            type,
        })
    },

    async update(projectId: ProjectId, request: UpdateParams): Promise<Project> {
        const externalId = request.externalId?.trim() !== '' ? request.externalId : undefined
        await assertExternalIdIsUnique(externalId, projectId)

        const baseUpdate = {
            ...spreadIfDefined('externalId', externalId),
            ...spreadIfDefined('releasesEnabled', request.releasesEnabled),
            ...spreadIfDefined('metadata', request.metadata),
            ...spreadIfDefined('maxConcurrentJobs', request.maxConcurrentJobs),
        }

        const teamUpdate = request.type === ProjectType.TEAM ? {
            ...spreadIfDefined('displayName', request.displayName),
            ...spreadIfDefined('icon', request.icon),
        } : {}

        await projectRepo().update({ id: projectId }, { ...baseUpdate, ...teamUpdate })
        return this.getOneOrThrow(projectId)
    },

    async getPlatformId(projectId: ProjectId): Promise<string> {
        const result = await projectRepo().createQueryBuilder('project').select('"platformId"').where({
            id: projectId,
        }).getRawOne()
        const platformId = result?.platformId
        if (isNil(platformId)) {
            throw new Error(`Platform ID for project ${projectId} is undefined in webhook.`)
        }
        return platformId
    },
    async getOneOrThrow(projectId: ProjectId): Promise<Project> {
        const project = await this.getOne(projectId)

        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: projectId,
                    entityType: 'project',
                },
            })
        }

        return project
    },
    async exists({ projectId, isSoftDeleted }: ExistsParams): Promise<boolean> {
        const project = await projectRepo().findOne({
            where: {
                id: projectId,
                deleted: isSoftDeleted ? Not(IsNull()) : IsNull(),
            },
            withDeleted: true,
        })
        return !isNil(project)
    },
    async getUserProjectOrThrow(userId: UserId): Promise<Project> {
        const user = await userService.getOneOrFail({ id: userId })
        assertNotNullOrUndefined(user.platformId, 'platformId is undefined')
        const projects = await this.getAllForUser({
            platformId: user.platformId,
            userId,
            isPrivileged: userService.isUserPrivileged(user),
        })
        if (isNil(projects) || projects.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: userId,
                    entityType: 'user',
                },
            })
        }
        return projects[0]
    },

    async getAllForUser(params: GetAllForUserParams): Promise<Project[]> {
        assertNotNullOrUndefined(params.platformId, 'platformId is undefined')
        
        const queryBuilder = projectRepo()
            .createQueryBuilder('project')
            .where('project."platformId" = :platformId', { platformId: params.platformId })
            .andWhere('project.deleted IS NULL')
            .orderBy('project.type', 'ASC')
            .addOrderBy('project.displayName', 'ASC')
            .addOrderBy('project.id', 'ASC')

        if (params.displayName) {
            queryBuilder.andWhere('project."displayName" ILIKE :displayName', { displayName: `%${params.displayName}%` })
        }

        await applyProjectsAccessFilters(queryBuilder, params)

        return queryBuilder.getMany()
    },
    async userHasProjects(params: GetAllForUserParams): Promise<boolean> {
        assertNotNullOrUndefined(params.platformId, 'platformId is undefined')
        
        const queryBuilder = projectRepo()
            .createQueryBuilder('project')
            .where('project."platformId" = :platformId', { platformId: params.platformId })

        await applyProjectsAccessFilters(queryBuilder, params)

        return queryBuilder.getExists()
    },
    async addProjectToPlatform({ projectId, platformId }: AddProjectToPlatformParams): Promise<void> {
        const query = {
            id: projectId,
        }

        const update = {
            platformId,
        }

        await projectRepo().update(query, update)
    },

    async getByPlatformIdAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformIdAndExternalIdParams): Promise<Project | null> {
        return projectRepo().findOneBy({
            platformId,
            externalId,
        })
    },
}


export async function applyProjectsAccessFilters<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    params: ApplyProjectsAccessFiltersParams,
): Promise<void> {
    const { platformId, userId, isPrivileged } = params
    if (isPrivileged) {
        return
    }

    queryBuilder.andWhere(new Brackets(qb => {
        qb.where(
            'project."ownerId" = :userId AND project.type = :personalType',
            { userId, personalType: ProjectType.PERSONAL },
        ).orWhere(
            'project.id IN (SELECT "projectId" FROM project_member WHERE "userId" = :userId AND "platformId" = :platformId)',
            { userId, platformId },
        )
    }))
}
async function assertExternalIdIsUnique(externalId: string | undefined | null, projectId: ProjectId): Promise<void> {
    if (!isNil(externalId)) {
        const externalIdAlreadyExists = await projectRepo().existsBy({
            id: Not(projectId),
            externalId,
        })

        if (externalIdAlreadyExists) {
            throw new ActivepiecesError({
                code: ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS,
                params: {
                    externalId,
                },
            })
        }
    }
}

type GetAllForUserParams = {
    platformId: string
    userId: string
    isPrivileged: boolean
    displayName?: string
}

type GetOneByOwnerAndPlatformParams = {
    ownerId: UserId
    platformId: string
}

type ExistsParams = {
    projectId: ProjectId
    isSoftDeleted?: boolean
}

type UpdateTeamProjectParams = {
    type: ProjectType.TEAM
    displayName?: string
    externalId?: string
    releasesEnabled?: boolean
    metadata?: Metadata
    maxConcurrentJobs?: number
    icon?: ProjectIcon
}

type UpdatePersonalProjectParams = {
    type: ProjectType.PERSONAL
    externalId?: string
    releasesEnabled?: boolean
    metadata?: Metadata
    maxConcurrentJobs?: number
}

type UpdateParams = UpdateTeamProjectParams | UpdatePersonalProjectParams

type CreateParams = {
    ownerId: UserId
    displayName: string
    type: ProjectType
    platformId: string
    externalId?: string
    metadata?: Metadata
    maxConcurrentJobs?: number
}

type GetByPlatformIdAndExternalIdParams = {
    platformId: string
    externalId: string
}

type AddProjectToPlatformParams = {
    projectId: ProjectId
    platformId: ApId
}

type NewProject = Omit<Project, 'created' | 'updated' | 'deleted'>

type ApplyProjectsAccessFiltersParams = {
    platformId: string
    userId: string
    isPrivileged: boolean
}
