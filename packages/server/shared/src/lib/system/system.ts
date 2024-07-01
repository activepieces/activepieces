import os from 'os'
import path from 'path'
import {
    ActivepiecesError,
    ApEdition,
    CodeSandboxType,
    ErrorCode,
    isNil,
    PieceSyncMode,
} from '@activepieces/shared'
import { AppSystemProp, SharedSystemProp, SystemProp, WorkerSystemProps } from './system-prop'


export enum CopilotInstanceTypes {
    AZURE_OPENAI = 'AZURE_OPENAI',
    OPENAI = 'OPENAI',
}

export enum PiecesSource {
    /**
   * @deprecated Use `DB`, as `CLOUD_AND_DB` is no longer supported.
   */
    CLOUD_AND_DB = 'CLOUD_AND_DB',
    DB = 'DB',
    FILE = 'FILE',
}

export enum ContainerType  {
    WORKER = 'WORKER',
    APP = 'APP',
    WORKER_AND_APP = 'WORKER_AND_APP',
}

export enum QueueMode {
    REDIS = 'REDIS',
    MEMORY = 'MEMORY',
}

export enum DatabaseType {
    POSTGRES = 'POSTGRES',
    SQLITE3 = 'SQLITE3',
}

const systemPropDefaultValues: Partial<Record<SystemProp, string>> = {
    [AppSystemProp.API_RATE_LIMIT_AUTHN_ENABLED]: 'true',
    [AppSystemProp.API_RATE_LIMIT_AUTHN_MAX]: '50',
    [AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW]: '1 minute',
    [AppSystemProp.CLIENT_REAL_IP_HEADER]: 'x-real-ip',
    [AppSystemProp.CLOUD_AUTH_ENABLED]: 'true',
    [SharedSystemProp.CODE_SANDBOX_TYPE]: CodeSandboxType.NO_OP,
    [AppSystemProp.CONFIG_PATH]: path.join(os.homedir(), '.activepieces'),
    [AppSystemProp.DB_TYPE]: DatabaseType.POSTGRES,
    [SharedSystemProp.EDITION]: ApEdition.COMMUNITY,
    [SharedSystemProp.CONTAINER_TYPE]: ContainerType.WORKER_AND_APP,
    [AppSystemProp.EXECUTION_DATA_RETENTION_DAYS]: '14',
    [AppSystemProp.PIECES_SYNC_MODE]: PieceSyncMode.OFFICIAL_AUTO,
    [AppSystemProp.COPILOT_INSTANCE_TYPE]: CopilotInstanceTypes.OPENAI,
    [AppSystemProp.AZURE_OPENAI_API_VERSION]: '2023-06-01-preview',
    [SharedSystemProp.ENGINE_EXECUTABLE_PATH]: 'dist/packages/engine/main.js',
    [SharedSystemProp.ENVIRONMENT]: 'prod',
    [SharedSystemProp.EXECUTION_MODE]: 'UNSANDBOXED',
    [WorkerSystemProps.FLOW_WORKER_CONCURRENCY]: '10',
    [SharedSystemProp.LOG_LEVEL]: 'info',
    [SharedSystemProp.LOG_PRETTY]: 'false',
    [SharedSystemProp.PACKAGE_ARCHIVE_PATH]: 'dist/archives',
    [SharedSystemProp.PIECES_SOURCE]: PiecesSource.CLOUD_AND_DB,
    [AppSystemProp.QUEUE_MODE]: QueueMode.REDIS,
    [SharedSystemProp.SANDBOX_MEMORY_LIMIT]: '524288',
    /*
     @deprecated, replease with FLOW_TIMEOUT_SECONDS
    */
    [SharedSystemProp.SANDBOX_RUN_TIME_SECONDS]: '600',
    [SharedSystemProp.TRIGGER_TIMEOUT_SECONDS]: '60',
    [AppSystemProp.TELEMETRY_ENABLED]: 'true',
    [AppSystemProp.TEMPLATES_SOURCE_URL]:
        'https://cloud.activepieces.com/api/v1/flow-templates',
    [AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: '5',
}

export const system = {
    get<T extends string>(prop: SystemProp): T | undefined {
        return getEnvVar(prop) as T | undefined
    },

    getNumber(prop: SystemProp): number | null {
        const stringNumber = getEnvVar(prop)

        if (!stringNumber) {
            return null
        }

        const parsedNumber = Number.parseInt(stringNumber, 10)

        if (Number.isNaN(parsedNumber)) {
            return null
        }

        return parsedNumber
    },

    getBoolean(prop: SystemProp): boolean | undefined {
        const value = getEnvVar(prop)

        if (isNil(value)) {
            return undefined
        }
        return value === 'true'
    },

    getList(prop: SystemProp): string[] {
        const values = getEnvVar(prop)

        if (isNil(values)) {
            return []
        }
        return values.split(',').map((value) => value.trim())
    },

    getOrThrow<T extends string>(prop: SystemProp): T {
        const value = getEnvVar(prop) as T | undefined

        if (value === undefined) {
            throw new ActivepiecesError(
                {
                    code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                    params: {
                        prop,
                    },
                },
                `System property AP_${prop} is not defined, please check the documentation`,
            )
        }

        return value
    },
    getEdition(): ApEdition {
        return this.getOrThrow<ApEdition>(SharedSystemProp.EDITION)
    },
    isWorker(): boolean {
        return [ContainerType.WORKER, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(SharedSystemProp.CONTAINER_TYPE),
        )
    },
    isApp(): boolean {
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(SharedSystemProp.CONTAINER_TYPE),
        )
    },
}

const getEnvVar = (prop: SystemProp): string | undefined => {
    return process.env[`AP_${prop}`] ?? systemPropDefaultValues[prop]
}


export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    UNSANDBOXED = 'UNSANDBOXED',
}
