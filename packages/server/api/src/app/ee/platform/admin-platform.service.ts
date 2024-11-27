import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    Platform,
    Project,
    ProjectId,
    UserId,
} from '@activepieces/shared'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { customDomainService } from '../custom-domains/custom-domain.service'
import { licenseKeysService } from '../license-keys/license-keys-service'

export const adminPlatformService = {
    async add({
        userId,
        projectId,
        name,
        domain,
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

        await platformService.update({
            id: platform.id,
            customDomainsEnabled: true,
        })
        
        await customDomainService.create({
            domain,
            platformId: platform.id,
        })

        await licenseKeysService.requestTrial({
            email: `mo+trial${name}@activepieces.com`,
            fullName: name,
            companyName: name,
            goal: 'Manual Trial',
            numberOfEmployees: 'TBD',
        })
        return platform
    },
}

type AdminAddPlatformParams = {
    userId: UserId
    projectId: ProjectId
    name: string
    domain: string
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