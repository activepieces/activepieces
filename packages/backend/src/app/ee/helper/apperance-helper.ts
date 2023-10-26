import { isNil } from '@activepieces/shared'
import { defaultTheme, generateTheme } from '../../flags/theme'
import { projectService } from '../../project/project-service'
import { platformService } from '../platform/platform.service'
import { customDomainService } from '../custom-domains/custom-domain.service'

const getPlatformIdFromCustomDomain = async (hostname: string) => {
    const customDomain = await customDomainService.getOneByDomain({ domain: hostname })
    return !isNil(customDomain) ? customDomain.platformId : null
}

const getPlatformIdFromProject = async (projectId: string) => {
    if (isNil(projectId)) {
        return null
    }
    const project = await projectService.getOne(projectId)
    return !isNil(project) && !isNil(project.platformId) ? project.platformId : null
}

const getPlatformByIdOrFallback = async (platformId: string | null) => {
    if (isNil(platformId)) {
        return defaultTheme
    }

    const platform = await platformService.getOneOrThrow(platformId)
    return generateTheme({
        websiteName: platform.name,
        fullLogoUrl: platform.fullLogoUrl,
        favIconUrl: platform.favIconUrl,
        logoIconUrl: platform.logoIconUrl,
        primaryColor: platform.primaryColor,
    })
}

const getPlatformId = async ({ projectId, hostname }: { projectId: string, hostname: string }) => {
    const platformIdFromCustomDomain = await getPlatformIdFromCustomDomain(hostname)
    const platformIdFromProject = await getPlatformIdFromProject(projectId)

    return platformIdFromCustomDomain ?? platformIdFromProject
}
export const apperanceHelper = {
    async getTheme({ projectId, hostname }: { projectId: string, hostname: string }) {
        const platformId = await getPlatformId({ projectId, hostname })
        return getPlatformByIdOrFallback(platformId)
    },
    async isWhiteLabeled({ projectId, hostname }: { projectId: string, hostname: string }): Promise<boolean> {
        const platformId = await getPlatformId({ projectId, hostname })
        return !isNil(platformId)
    },
}
