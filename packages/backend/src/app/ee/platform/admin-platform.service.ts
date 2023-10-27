import { ActivepiecesError, ErrorCode, Project, ProjectId, UserId, isNil } from '@activepieces/shared'
import { projectService } from '../../project/project-service'
import { platformService } from './platform.service'
import { Platform } from '@activepieces/ee-shared'

export const adminPlatformService = {
    async add({ userId, projectId, name }: AdminAddPlatformParams): Promise<Platform> {
        const project = await getProjectOrThrow(projectId)

        const newPlatform = await platformService.add({
            ownerId: userId,
            name,
        })

        await projectService.addProjectToPlatform({
            projectId: project.id,
            platformId: newPlatform.id,
        })

        return newPlatform
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
