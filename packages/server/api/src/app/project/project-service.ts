import {
    ActivepiecesError,
    apId,
    ApId,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    NotificationStatus,
    PlatformRole,
    Project,
    ProjectId,
    spreadIfDefined,
    UserId,
} from '@activepieces/shared'
import { FindOptionsWhere, ILike, In, IsNull, Not } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
// import { projectMemberService } from '../ee/project-members/project-member.service'
import { system } from '../helper/system/system'
import { userService } from '../user/user-service'
import { ProjectEntity } from './project-entity'
import { projectHooks } from './project-hooks'
export const projectRepo = repoFactory(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {
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
            deleted: IsNull(),
        })
    },

    async getOne(projectId: ProjectId | undefined): Promise<Project | null> {
        if (isNil(projectId)) {
            return null
        }

        return projectRepo().findOneBy({
            id: projectId,
            deleted: IsNull(),
        })
    },

    async update(projectId: ProjectId, request: UpdateParams): Promise<Project> {
        const externalId = request.externalId?.trim() !== '' ? request.externalId : undefined
        await assertExternalIdIsUnique(externalId, projectId)

        await projectRepo().update(
            {
                id: projectId,
                deleted: IsNull(),
            },
            {
                ...spreadIfDefined('externalId', externalId),
                ...spreadIfDefined('displayName', request.displayName),
                ...spreadIfDefined('notifyStatus', request.notifyStatus),
                ...spreadIfDefined('releasesEnabled', request.releasesEnabled),
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
    async exists(projectId: ProjectId): Promise<boolean> {
        return projectRepo().existsBy({
            id: projectId,
            deleted: IsNull(),
        })
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
                    entityType: 'project',
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
            deleted: IsNull(),
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
            deleted: IsNull(),
        })
    },
}


async function getUsersFilters(params: GetAllForUserParams): Promise<FindOptionsWhere<Project>[]> {
    // const [projectIds, user] = await Promise.all([
    //     projectMemberService(system.globalLogger()).getIdsOfProjects({
    //         platformId: params.platformId,
    //         userId: params.userId,
    //     }),
    //     userService.getOneOrFail({ id: params.userId }),
    // ])
    const user = await userService.getOneOrFail({ id: params.userId })

    const adminFilter = user.platformRole === PlatformRole.ADMIN
        ? [{
            deleted: IsNull(),
            platformId: params.platformId,
        }]
        : []
    const displayNameFilter = params.displayName ? { displayName: ILike(`%${params.displayName}%`) } : {}
    const memberFilter = {
        deleted: IsNull(),
        platformId: params.platformId,
        // id: In(projectIds),
        ...displayNameFilter,
    }

    return [...adminFilter, memberFilter]
}
async function assertExternalIdIsUnique(externalId: string | undefined | null, projectId: ProjectId): Promise<void> {
    if (!isNil(externalId)) {
        const externalIdAlreadyExists = await projectRepo().existsBy({
            id: Not(projectId),
            externalId,
            deleted: IsNull(),
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


type UpdateParams = {
    displayName?: string
    externalId?: string
    notifyStatus?: NotificationStatus
    releasesEnabled?: boolean
}

type CreateParams = {
    ownerId: UserId
    displayName: string
    platformId: string
    externalId?: string
    notifyStatus?: NotificationStatus
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
