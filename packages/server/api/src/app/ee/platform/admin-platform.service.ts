import {
    ActivepiecesError,
    ErrorCode,
    Project,
    ProjectId,
    UserId,
    Platform,
    isNil,
} from '@activepieces/shared'
import { projectService } from '../../project/project-service'
import { platformService } from '../../platform/platform.service'

export const adminPlatformService = {
    async add({
        userId,
        projectId,
        name,
    }: AdminAddPlatformParams): Promise<Platform> {
        const project = await getProjectOrThrow(projectId)

        const platform = await platformService.create({
            ownerId: userId,
            name,
        })

        await projectService.addProjectToPlatform({
            projectId: project.id,
            platformId: platform.id,
        })
        return platform
    },
}

type AdminAddPlatformParams = {
    userId: UserId
    projectId: ProjectId
    name: string
}

const getProjectOrThrow = async (projectId: ProjectId): Promise<Project> => {
    const project = await projectService.getOne(projectId)

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
}