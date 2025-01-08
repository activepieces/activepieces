import { networkUtls, WorkerSystemProp } from '@activepieces/server-shared'
import { system } from './system/system'
import { AppSystemProp } from './system/system-prop'

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
        return `${await networkUtls.getPublicUrl(system.getOrThrow(AppSystemProp.ENVIRONMENT), system.getOrThrow(WorkerSystemProp.FRONTEND_URL))}${path}`
    },
    async constructFrontendUrlFromRequest({
        path,
    }: {
        domain: string
        path: string
    }): Promise<string> {
        const frontendUrl = system.getOrThrow(WorkerSystemProp.FRONTEND_URL)
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
