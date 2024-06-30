import { networkUtls, SharedSystemProp, system } from '@activepieces/server-shared'

type DomainHelper = {
    constructFrontendUrlFromRequest({
        domain,
        path,
    }: {
        domain: string
        path: string
    }): Promise<string>
    constructApiUrlFromRequest({
        domain,
        path,
    }: {
        domain: string
        path: string
    }): Promise<string>
}

let _domainHelper: DomainHelper = {
    async constructApiUrlFromRequest({
        path,
    }: {
        domain: string
        path: string
    }): Promise<string> {
        return `${await networkUtls.getApiUrl()}${path}`
    },
    async constructFrontendUrlFromRequest({
        path,
    }: {
        domain: string
        path: string
    }): Promise<string> {
        const frontendUrl = system.getOrThrow(SharedSystemProp.FRONTEND_URL)
        return `${frontendUrl}${frontendUrl.endsWith('/') ? '' : '/'}${path}`
    },
}
export const domainHelper = {
    set(newHelper: DomainHelper): void {
        _domainHelper = newHelper
    },
    get(): DomainHelper {
        return _domainHelper
    },
}
