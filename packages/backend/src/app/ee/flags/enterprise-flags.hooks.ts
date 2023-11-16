import { ApFlagId, isNil } from '@activepieces/shared'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { apperanceHelper } from '../helper/apperance-helper'
import { projectService } from '../../project/project-service'
import { customDomainService } from '../custom-domains/custom-domain.service'
import { platformService } from '../platform/platform.service'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, hostname, projectId }) {
        const modifiedFlags = { ...flags }
        const platformId = await getPlatformId({ projectId, hostname })
        const platformEnabled = !isNil(platformId)
        if (platformEnabled) {
            const platform = await platformService.getOneOrThrow(platformId)
            modifiedFlags[ApFlagId.THEME] = await apperanceHelper.getTheme({ platformId })
            modifiedFlags[ApFlagId.SHOW_COMMUNITY] = false
            modifiedFlags[ApFlagId.SHOW_DOCS] = false
            modifiedFlags[ApFlagId.SHOW_BILLING] = false
            modifiedFlags[ApFlagId.SHOW_AUTH_PROVIDERS] = false
            modifiedFlags[ApFlagId.SHOW_BLOG_GUIDE] = false
            modifiedFlags[ApFlagId.SHOW_POWERED_BY_AP] = platform.showPoweredBy
            modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
            modifiedFlags[ApFlagId.FRONTEND_URL] = `https://${hostname}`
            modifiedFlags[ApFlagId.WEBHOOK_URL_PREFIX] = `https://${hostname}/api/v1/webhooks`
            modifiedFlags[ApFlagId.PRIVACY_POLICY_URL] = platform.privacyPolicyUrl
            modifiedFlags[ApFlagId.TERMS_OF_SERVICE_URL] = platform.termsOfServiceUrl
            modifiedFlags[ApFlagId.TEMPLATES_SOURCE_URL] = null
        }
        return modifiedFlags
    },
}

const getPlatformIdFromCustomDomain = async (hostname: string): Promise<string | null> => {
    const customDomain = await customDomainService.getOneByDomain({ domain: hostname })
    return !isNil(customDomain) ? customDomain.platformId : null
}

const getPlatformIdFromProject = async (projectId: string): Promise<string | null> => {
    if (isNil(projectId)) {
        return null
    }
    const project = await projectService.getOne(projectId)
    return !isNil(project) && !isNil(project.platformId) ? project.platformId : null
}


const getPlatformId = async ({ projectId, hostname }: { projectId: string, hostname: string }) => {
    const platformIdFromCustomDomain = await getPlatformIdFromCustomDomain(hostname)
    const platformIdFromProject = await getPlatformIdFromProject(projectId)

    return platformIdFromCustomDomain ?? platformIdFromProject
}