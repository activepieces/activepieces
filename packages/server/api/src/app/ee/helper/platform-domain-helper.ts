import { system, SystemProp } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
import { customDomainService } from '../custom-domains/custom-domain.service'

export const platformDomainHelper = {
    async constructUrlFrom({
        platformId,
        path,
    }: {
        platformId: string | undefined | null
        path: string
    }): Promise<string> {
        const domain = await getFrontendDomain(platformId)
        return `${domain}${path}`
    },
    async constructFrontendUrlFromRequest({
        domain,
        path,
    }: {
        domain: string
        path: string
    }): Promise<string> {
        const domainWithProtocol = await getFrontendDomainFromHostname(domain)
        return `${domainWithProtocol}${path}`
    },
    async constructApiUrlFromRequest({
        domain,
        path,
    }: {
        domain: string
        path: string
    }): Promise<string> {
        const domainWithProtocol = await getApiDomainFromHostname(domain)
        return `${domainWithProtocol}${path}`
    },
}

async function getFrontendDomainFromHostname(
    hostname: string,
): Promise<string> {
    let domain = system.get(SystemProp.FRONTEND_URL)
    const customDomain = await customDomainService.getOneByDomain({
        domain: hostname,
    })
    if (customDomain) {
        domain = `https://${customDomain.domain}/`
    }
    return domain + (domain?.endsWith('/') ? '' : '/')
}

async function getApiDomainFromHostname(hostname: string): Promise<string> {
    const frontendUrl = await getFrontendDomainFromHostname(hostname)
    return frontendUrl + 'api/'
}
async function getFrontendDomain(
    platformId: string | undefined | null,
): Promise<string> {
    let domain = system.getOrThrow(SystemProp.FRONTEND_URL)
    if (platformId && [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())) {
        const customDomain = await customDomainService.getOneByPlatform({
            platformId,
        })
        if (customDomain) {
            domain = `https://${customDomain.domain}/`
        }
    }
    return domain + (domain.endsWith('/') ? '' : '/')
}
