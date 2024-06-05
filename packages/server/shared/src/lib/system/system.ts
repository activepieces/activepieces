import os from 'os'
import path from 'path'
import {
    ActivepiecesError,
    CodeSandboxType,
    ErrorCode,
    isNil,
    PieceSyncMode,
} from '@activepieces/shared'
import { SystemProp } from './system-prop'


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

export enum QueueMode {
    REDIS = 'REDIS',
    MEMORY = 'MEMORY',
}

export enum DatabaseType {
    POSTGRES = 'POSTGRES',
    SQLITE3 = 'SQLITE3',
}

const systemPropDefaultValues: Partial<Record<SystemProp, string>> = {
    [SystemProp.API_RATE_LIMIT_AUTHN_ENABLED]: 'true',
    [SystemProp.API_RATE_LIMIT_AUTHN_MAX]: '50',
    [SystemProp.API_RATE_LIMIT_AUTHN_WINDOW]: '1 minute',
    [SystemProp.CLIENT_REAL_IP_HEADER]: 'x-real-ip',
    [SystemProp.CLOUD_AUTH_ENABLED]: 'true',
    [SystemProp.CODE_SANDBOX_TYPE]: CodeSandboxType.NO_OP,
    [SystemProp.CONFIG_PATH]: path.join(os.homedir(), '.activepieces'),
    [SystemProp.DB_TYPE]: DatabaseType.POSTGRES,
    [SystemProp.EDITION]: 'ce',
    [SystemProp.EXECUTION_DATA_RETENTION_DAYS]: '14',
    [SystemProp.PIECES_SYNC_MODE]: PieceSyncMode.OFFICIAL_AUTO,
    [SystemProp.COPILOT_INSTANCE_TYPE]: CopilotInstanceTypes.OPENAI,
    [SystemProp.AZURE_OPENAI_API_VERSION]: '2023-06-01-preview',
    [SystemProp.ENGINE_EXECUTABLE_PATH]: 'dist/packages/engine/main.js',
    [SystemProp.ENVIRONMENT]: 'prod',
    [SystemProp.EXECUTION_MODE]: 'UNSANDBOXED',
    [SystemProp.FLOW_WORKER_CONCURRENCY]: '10',
    [SystemProp.LOG_LEVEL]: 'info',
    [SystemProp.LOG_PRETTY]: 'false',
    [SystemProp.PACKAGE_ARCHIVE_PATH]: 'dist/archives',
    [SystemProp.PIECES_SOURCE]: PiecesSource.CLOUD_AND_DB,
    [SystemProp.QUEUE_MODE]: QueueMode.REDIS,
    [SystemProp.SANDBOX_MEMORY_LIMIT]: '524288',
    [SystemProp.SANDBOX_RUN_TIME_SECONDS]: '600',
    [SystemProp.SIGN_UP_ENABLED]: 'false',
    [SystemProp.TELEMETRY_ENABLED]: 'true',
    [SystemProp.TEMPLATES_SOURCE_URL]:
    'https://cloud.activepieces.com/api/v1/flow-templates',
    [SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: '5',
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
}

const getEnvVar = (prop: SystemProp): string | undefined => {
    return process.env[`AP_${prop}`] ?? systemPropDefaultValues[prop]
}


export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    UNSANDBOXED = 'UNSANDBOXED',
}
