import { isNil } from '@activepieces/core-utils'
import { Project, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'

export const sdkProjectService = (log: FastifyBaseLogger) => ({
    async getOrCreateProject({ platformId, externalProjectId }: GetOrCreateProjectParams): Promise<GetOrCreateProjectResult> {
        const existingProject = await projectService(log).getByPlatformIdAndExternalId({
            platformId,
            externalId: externalProjectId,
        })

        if (!isNil(existingProject)) {
            return { project: existingProject, isNewProject: false }
        }

        const platform = await platformService(log).getOneOrThrow(platformId)

        const project = await projectService(log).create({
            displayName: externalProjectId,
            ownerId: platform.ownerId,
            platformId,
            externalId: externalProjectId,
            type: ProjectType.HEADLESS_SDK,
        })

        return { project, isNewProject: true }
    },
})

type GetOrCreateProjectParams = {
    platformId: string
    externalProjectId: string
}

type GetOrCreateProjectResult = {
    project: Project
    isNewProject: boolean
}
