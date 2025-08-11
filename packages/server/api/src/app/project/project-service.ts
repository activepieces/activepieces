import {
    ActivepiecesError,
    ApId,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    Metadata,
    NotificationStatus,
    PlatformRole,
    PlatformUsageMetric,
    Project,
    ProjectId,
    spreadIfDefined,
    UserId,
} from '@activepieces/shared'
import { FindOptionsWhere, ILike, In, IsNull, Not } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { PlatformPlanHelper } from '../ee/platform/platform-plan/platform-plan-helper'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { system } from '../helper/system/system'
import { userService } from '../user/user-service'
import { ProjectEntity } from './project-entity'
import { projectHooks } from './project-hooks'

export const projectRepo = repoFactory(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {

        await PlatformPlanHelper.checkQuotaOrThrow({
            platformId: params.platformId,
            metric: PlatformUsageMetric.PROJECTS,
        })

        const newProject: NewProject = {
            id: apId(),
            ...params,
            notifyStatus: params.notifyStatus ?? NotificationStatus.ALWAYS,
            releasesEnabled: false,
        }
        const savedProject = await projectRepo().save(newProject)
        await projectHooks.get(system.globalLogger()).postCreate(savedProject)
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
        const projects = await projectRepo().find({
            select: {
                id: true,
            },
            where: {
                platformId,
            },
        })

        return projects.map((project) => project.id)
    },

    async update(projectId: ProjectId, request: UpdateParams): Promise<Project> {
        const externalId = request.externalId?.trim() !== '' ? request.externalId : undefined
        await assertExternalIdIsUnique(externalId, projectId)

        await projectRepo().update(
            {
                id: projectId,
            },
            {
                ...spreadIfDefined('externalId', externalId),
                ...spreadIfDefined('displayName', request.displayName),
                ...spreadIfDefined('notifyStatus', request.notifyStatus),
                ...spreadIfDefined('releasesEnabled', request.releasesEnabled),
                ...spreadIfDefined('metadata', request.metadata),
            },
        )
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
        const filters = await getUsersFilters(params)
        return projectRepo().findBy(filters)
    },
    async userHasProjects(params: GetAllForUserParams): Promise<boolean> {
        const filters = await getUsersFilters(params)
        return projectRepo().existsBy(filters)
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


async function getUsersFilters(params: GetAllForUserParams): Promise<FindOptionsWhere<Project>[]> {
    const user = await userService.getOneOrFail({ id: params.userId })
    const isPrivilegedUser = user.platformRole === PlatformRole.ADMIN || user.platformRole === PlatformRole.OPERATOR
    const displayNameFilter = params.displayName ? { displayName: ILike(`%${params.displayName}%`) } : {}
    
    if (isPrivilegedUser) {
        // Platform admins and operators can see all projects in their platform
        return [{
            platformId: params.platformId,
            ...displayNameFilter,
        }]
    }
    
    // Only fetch project memberships for non-privileged users
    const projectIds = await projectMemberService(system.globalLogger()).getIdsOfProjects({
        platformId: params.platformId,
        userId: params.userId,
    })
    
    // Regular members can only see projects they're members of
    return [{
        platformId: params.platformId,
        id: In(projectIds),
        ...displayNameFilter,
    }]
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


type UpdateParams = {
    displayName?: string
    externalId?: string
    notifyStatus?: NotificationStatus
    releasesEnabled?: boolean
    metadata?: Metadata
}

type CreateParams = {
    ownerId: UserId
    displayName: string
    platformId: string
    externalId?: string
    notifyStatus?: NotificationStatus
    metadata?: Metadata
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
