import { assertNotNullOrUndefined } from '@activepieces/shared'

export const systemConstants = {
    PACKAGE_ARCHIVE_PATH: 'cache/archives',
    POLLING_POOL_SIZE: 5,
    ENGINE_EXECUTABLE_PATH: 'dist/packages/engine/main.js',
}

export enum PiecesSource {
    /**
   * @deprecated Use `DB`, as `CLOUD_AND_DB` is no longer supported.
   */
    CLOUD_AND_DB = 'CLOUD_AND_DB',
    DB = 'DB',
    FILE = 'FILE',
}

export enum ContainerType {
    WORKER = 'WORKER',
    APP = 'APP',
    WORKER_AND_APP = 'WORKER_AND_APP',
}

export enum WorkerSystemProp {
    FRONTEND_URL = 'FRONTEND_URL',
    WORKER_TOKEN = 'WORKER_TOKEN',
    CONTAINER_TYPE = 'CONTAINER_TYPE',
}

export const environmentVariables = {
    hasAppModules(): boolean {
        const environment = this.getEnvironment(WorkerSystemProp.CONTAINER_TYPE) ?? ContainerType.WORKER_AND_APP
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(environment as ContainerType)
    },
    getEnvironment: (prop: WorkerSystemProp) => {
        return process.env[`AP_${prop}`]
    },
    getEnvironmentOrThrow: (prop: WorkerSystemProp) => {
        const value = environmentVariables.getEnvironment(prop)
        assertNotNullOrUndefined(value, `Environment variable ${prop} is not set`)
        return value
    },
}