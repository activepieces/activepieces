/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import {
    ActivepiecesError, assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    FlowStatus, Metadata, NotificationStatus, PlatformId,
    Project,
    ProjectId, SeekPage,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, ILike, In, IsNull } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { ProjectEntity } from '../../project/project-entity'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'

const projectRepo = repoFactory(ProjectEntity)

export const platformProjectService = (log: FastifyBaseLogger) => ({
    async getAllForPlatform(params: GetAllForParamsAndUser): Promise<SeekPage<Project>> {
        const user = await userService.getOneOrFail({ id: params.userId })

        assertNotNullOrUndefined(user.platformId, 'User does not have a platform set')

        const projects = await projectService.getAllForUser({
            platformId: params.platformId,
            userId: params.userId,
            displayName: params.displayName,
        })

        return getProjects({ ...params, projectIds: projects.map((project) => project.id) })
    },

    async getWithPlanAndUsageOrThrow(projectId: string): Promise<Project> {
        return projectRepo().findOneByOrFail({
            id: projectId,
            deleted: IsNull(),
        })
    },

    async update({ projectId, request }: UpdateParams): Promise<Project> {
        return projectService.update(projectId, request)
    },

    async hardDelete({ id }: HardDeleteParams): Promise<void> {
        await assertAllProjectFlowsAreDisabled({ projectId: id }, log)
        await projectRepo().delete({ id })
        await appConnectionService(log).deleteAllProjectConnections(id)
    },
})

async function getProjects(params: GetAllParams & { projectIds?: string[] }): Promise<SeekPage<Project>> {
    const { cursorRequest, limit, platformId, displayName, externalId, projectIds } = params
    const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
    const paginator = buildPaginator({
        entity: ProjectEntity,
        query: {
            limit,
            order: 'ASC',
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
        },
    })
    const displayNameFilter = displayName ? ILike(`%${displayName}%`) : undefined
    const filters = {
        platformId: Equal(platformId),
        deleted: IsNull(),
        ...spreadIfDefined('externalId', externalId),
        ...spreadIfDefined('displayName', displayNameFilter),
        ...(projectIds ? { id: In(projectIds) } : {}),
    }

    const queryBuilder = projectRepo()
        .createQueryBuilder('project')
        .where(filters)

    const { data, cursor } = await paginator.paginate(queryBuilder)

    return paginationHelper.createPage<Project>(data, cursor)
}

type GetAllForParamsAndUser = {
    userId: string
} & GetAllParams

type GetAllParams = {
    platformId: string
    displayName?: string
    externalId?: string
    cursorRequest: Cursor | null
    limit: number
}

const assertAllProjectFlowsAreDisabled = async (params: AssertAllProjectFlowsAreDisabledParams, log: FastifyBaseLogger): Promise<void> => {
    const { projectId } = params

    const projectHasEnabledFlows = await flowService(log).existsByProjectAndStatus({
        projectId,
        status: FlowStatus.ENABLED,
    })

    if (projectHasEnabledFlows) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'PROJECT_HAS_ENABLED_FLOWS',
            },
        })
    }
}

type UpdateParams = {
    projectId: ProjectId
    request: UpdateProjectRequestParams
    platformId?: PlatformId
}

type UpdateProjectRequestParams = {
    displayName?: string
    externalId?: string
    notifyStatus?: NotificationStatus
    releasesEnabled?: boolean
    metadata?: Metadata
}

type AssertAllProjectFlowsAreDisabledParams = {
    projectId: ProjectId
}

type HardDeleteParams = {
    id: ProjectId
}
