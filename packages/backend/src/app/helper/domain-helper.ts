import { getServerUrl } from './public-ip-utils'

type DomainHelper = {
    constructUrlFromRequest({ domain, path }: { domain: string, path: string }): Promise<string>
}

let _domainHelper: DomainHelper = {
    async constructUrlFromRequest({ path }: { domain: string, path: string }): Promise<string> {
        return `${await getServerUrl()}${path}`
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

