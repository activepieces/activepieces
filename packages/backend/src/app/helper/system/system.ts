import { ActivepiecesError, ApEdition, ErrorCode } from '@activepieces/shared'
import { SystemProp } from './system-prop'
import { loadEncryptionKey } from '../encryption'
import { logger } from '../logger'

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
    [SystemProp.FLOW_WORKER_CONCURRENCY]: '10',
    [SystemProp.LOG_LEVEL]: 'info',
    [SystemProp.LOG_PRETTY]: 'false',
    [SystemProp.QUEUE_MODE]: QueueMode.REDIS,
    [SystemProp.SANDBOX_MEMORY_LIMIT]: '131072',
    [SystemProp.SANDBOX_RUN_TIME_SECONDS]: '600',
    [SystemProp.SIGN_UP_ENABLED]: 'false',
    [SystemProp.STATS_ENABLED]: 'false',
    [SystemProp.TELEMETRY_ENABLED]: 'true',
    [SystemProp.TEMPLATES_SOURCE_URL]: 'https://cloud.activepieces.com/api/v1/flow-templates',
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
        const env = getEnvVar(prop)
        if (env === undefined) {
            return undefined
        }
        return getEnvVar(prop) === 'true'
    },

    getOrThrow<T extends string>(prop: SystemProp): T {
        const value = getEnvVar(prop) as T | undefined

        if (value === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                params: {
                    prop,
                },
            }, `System property AP_${prop} is not defined, please check the documentation`)
        }

        return value
    },
}

const getEnvVar = (prop: SystemProp): string | undefined => {
    return process.env[`AP_${prop}`] ?? systemPropDefaultValues[prop]
}

export const validateEnvPropsOnStartup = (): void => {
    const executionMode = system.get(SystemProp.EXECUTION_MODE)
    const signedUpEnabled = system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false
    const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)
    const edition = system.get(SystemProp.EDITION)
    loadEncryptionKey(queueMode)
        .catch((e) => logger.error(e, '[System#validateEnvPropsOnStartup] loadEncryptionKey'))

    if (executionMode !== ExecutionMode.SANDBOXED && edition !== ApEdition.COMMUNITY) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.EXECUTION_MODE,
            },
        }, 'Allowing users to sign up is not allowed in non community edtion')
    }
    if (executionMode === ExecutionMode.UNSANDBOXED && signedUpEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.EXECUTION_MODE,
            },
        }, 'Allowing users to sign up is not allowed in unsandboxed mode, please check the configuration section in the documentation')
    }
}

export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    UNSANDBOXED = 'UNSANDBOXED',
}
