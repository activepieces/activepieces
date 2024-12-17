import { ApEnvironment } from '@activepieces/shared'
import { machine } from './machine'
import { networkUtls } from '@activepieces/server-shared'

export const appNetworkUtils = {
    getPublicUrl: async (): Promise<string> => {
        const environment = machine.getSettings().ENVIRONMENT as ApEnvironment
        let url = machine.getSettings().FRONTEND_URL
        return networkUtls.getPublicUrl(environment, url)
    },
    getInternalApiUrl: (): string => {
        if (machine.hasAppModules()) {
            return 'http://127.0.0.1:3000/'
        }
        const url = machine.getSettings().FRONTEND_URL
        return appendSlashAndApi(url)
    }
}

const appendSlashAndApi = (url: string): string => {
    const slash = url.endsWith('/') ? '' : '/'
    return `${url}${slash}api/`
}

