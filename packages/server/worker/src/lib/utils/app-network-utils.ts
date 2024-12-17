import { ApEnvironment } from '@activepieces/shared'
import { machine } from './machine'
import { networkUtls } from '@activepieces/server-shared'

export const appNetworkUtils = {
    getPublicUrl: async (): Promise<string> => {
        const environment = machine.getSettings().ENVIRONMENT
        let url = machine.getSettings().FRONTEND_URL
        
        if (extractHostname(url) === 'localhost' && environment === ApEnvironment.PRODUCTION) {
            url = `http://${(await networkUtls.getPublicIp()).ip}`
        }

        return appendSlashAndApi(url)
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

function extractHostname(url: string): string | null {
    try {
        const hostname = new URL(url).hostname
        return hostname
    }
    catch (e) {
        return null
    }
}