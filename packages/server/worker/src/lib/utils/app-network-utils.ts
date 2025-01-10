import { environmentVariables, networkUtls, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { workerMachine } from './machine'

export const appNetworkUtils = {
    getPublicUrl: async (): Promise<string> => {
        const environment = workerMachine.getSettings().ENVIRONMENT as ApEnvironment
        const url = environmentVariables.getEnvironmentOrThrow(WorkerSystemProp.FRONTEND_URL)  
        return networkUtls.getPublicUrl(environment, url)
    },
    getInternalApiUrl: (): string => {
        if (environmentVariables.hasAppModules()) {
            return 'http://127.0.0.1:3000/'
        }
        const url = environmentVariables.getEnvironmentOrThrow(WorkerSystemProp.FRONTEND_URL)
        return appendSlashAndApi(url)
    },
}

const appendSlashAndApi = (url: string): string => {
    const slash = url.endsWith('/') ? '' : '/'
    return `${url}${slash}api/`
}

