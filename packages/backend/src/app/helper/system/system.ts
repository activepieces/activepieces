import {
    ActivepiecesError,
    ApEnvironment,
    CodeSandboxType,
    ErrorCode,
    isNil,
} from '@activepieces/shared'
import { SystemProp } from './system-prop'
import { loadEncryptionKey } from '../encryption'
import path from 'path'
import os from 'os'

export enum PiecesSource {
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
    [SystemProp.CLOUD_AUTH_ENABLED]: 'true',
    [SystemProp.DB_TYPE]: DatabaseType.POSTGRES,
    [SystemProp.EDITION]: 'ce',
    [SystemProp.ENGINE_EXECUTABLE_PATH]: 'dist/packages/engine/main.js',
    [SystemProp.ENVIRONMENT]: 'prod',
    [SystemProp.EXECUTION_MODE]: 'UNSANDBOXED',
    [SystemProp.CODE_SANDBOX_TYPE]: CodeSandboxType.NO_OP,
    [SystemProp.FLOW_WORKER_CONCURRENCY]: '10',
    [SystemProp.LOG_LEVEL]: 'info',
    [SystemProp.LOG_PRETTY]: 'false',
    [SystemProp.QUEUE_MODE]: QueueMode.REDIS,
    [SystemProp.SANDBOX_MEMORY_LIMIT]: '131072',
    [SystemProp.CONFIG_PATH]: path.join(os.homedir(), '.activepieces'),
    [SystemProp.SANDBOX_RUN_TIME_SECONDS]: '600',
    [SystemProp.SIGN_UP_ENABLED]: 'false',
    [SystemProp.STATS_ENABLED]: 'false',
    [SystemProp.PACKAGE_ARCHIVE_PATH]: 'dist/archives',
    [SystemProp.TELEMETRY_ENABLED]: 'true',
    [SystemProp.PIECES_SOURCE]: PiecesSource.CLOUD_AND_DB,
    [SystemProp.TEMPLATES_SOURCE_URL]:
        'https://cloud.activepieces.com/api/v1/flow-templates',
    [SystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: '5',
    [SystemProp.QUEUE_UI_ENABLED]: 'false',
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

export const validateEnvPropsOnStartup = async (): Promise<void> => {
    const codeSandboxType = system.get<CodeSandboxType>(SystemProp.CODE_SANDBOX_TYPE)
    const executionMode = system.get<ExecutionMode>(SystemProp.EXECUTION_MODE)
    const signedUpEnabled =
        system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false
    const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)
    const environment = system.get(SystemProp.ENVIRONMENT)
    await loadEncryptionKey(queueMode)

    if (
        executionMode === ExecutionMode.UNSANDBOXED &&
        codeSandboxType !== CodeSandboxType.V8_ISOLATE &&
        signedUpEnabled &&
        environment === ApEnvironment.PRODUCTION
    ) {
        throw new ActivepiecesError(
            {
                code: ErrorCode.SYSTEM_PROP_INVALID,
                params: {
                    prop: SystemProp.EXECUTION_MODE,
                },
            },
            'Allowing users to sign up is not allowed in unsandboxed mode, please check the configuration section in the documentation',
        )
    }
}

export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    UNSANDBOXED = 'UNSANDBOXED',
}
