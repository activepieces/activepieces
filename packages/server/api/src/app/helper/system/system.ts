import os from 'os'
import path from 'path'
import { AppSystemProp, ContainerType, environmentVariables, PiecesSource, pinoLogging, SystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ExecutionMode,
    FileLocation,
    isNil,
    PieceSyncMode,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Level } from 'pino'


export enum CopilotInstanceTypes {
    AZURE_OPENAI = 'AZURE_OPENAI',
    OPENAI = 'OPENAI',
}

export enum RedisType {
    SENTINEL = 'SENTINEL',
    DEFAULT = 'DEFAULT',
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
    [AppSystemProp.CONFIG_PATH]: path.join(os.homedir(), '.activepieces'),
    [AppSystemProp.DB_TYPE]: DatabaseType.POSTGRES,
    [AppSystemProp.EDITION]: ApEdition.COMMUNITY,
    [AppSystemProp.APP_WEBHOOK_SECRETS]: '{}',
    [WorkerSystemProp.CONTAINER_TYPE]: ContainerType.WORKER_AND_APP,
    [AppSystemProp.EXECUTION_DATA_RETENTION_DAYS]: '30',
    [AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS]: '30',
    [AppSystemProp.PIECES_SYNC_MODE]: PieceSyncMode.OFFICIAL_AUTO,
    [AppSystemProp.TRIGGER_FAILURES_THRESHOLD]: '576',
    [AppSystemProp.ENVIRONMENT]: 'prod',
    [AppSystemProp.EXECUTION_MODE]: ExecutionMode.UNSANDBOXED,
    [WorkerSystemProp.FLOW_WORKER_CONCURRENCY]: '10',
    [AppSystemProp.WEBHOOK_TIMEOUT_SECONDS]: '30',
    [WorkerSystemProp.SCHEDULED_WORKER_CONCURRENCY]: '10',
    [AppSystemProp.LOG_LEVEL]: 'info',
    [AppSystemProp.LOG_PRETTY]: 'false',
    [AppSystemProp.PIECES_SOURCE]: PiecesSource.DB,
    [AppSystemProp.S3_USE_SIGNED_URLS]: 'false',
    [AppSystemProp.QUEUE_MODE]: QueueMode.REDIS,
    [AppSystemProp.MAX_FILE_SIZE_MB]: '4',
    [AppSystemProp.FILE_STORAGE_LOCATION]: FileLocation.DB,
    [AppSystemProp.SANDBOX_MEMORY_LIMIT]: '1048576',
    [AppSystemProp.FLOW_TIMEOUT_SECONDS]: '600',
    [AppSystemProp.TRIGGER_TIMEOUT_SECONDS]: '60',
    [AppSystemProp.TELEMETRY_ENABLED]: 'true',
    [AppSystemProp.REDIS_TYPE]: RedisType.DEFAULT,
    [AppSystemProp.TEMPLATES_SOURCE_URL]:
        'https://cloud.activepieces.com/api/v1/flow-templates',
    [AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: '5',
    [AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT]: '100',
    [AppSystemProp.PROJECT_RATE_LIMITER_ENABLED]: 'false',
}

let globalLogger: FastifyBaseLogger
export const system = {
    globalLogger(): FastifyBaseLogger {
        if (isNil(globalLogger)) {
            const logLevel: Level = this.get(AppSystemProp.LOG_LEVEL) ?? 'info'
            const logPretty = this.getBoolean(AppSystemProp.LOG_PRETTY) ?? false
            const lokiUrl = this.get(AppSystemProp.LOKI_URL)
            const lokiPassword = this.get(AppSystemProp.LOKI_PASSWORD)
            const lokiUsername = this.get(AppSystemProp.LOKI_USERNAME)
            globalLogger = pinoLogging.initLogger(logLevel, logPretty, {
                url: lokiUrl,
                password: lokiPassword,
                username: lokiUsername,
            })
        }
        return globalLogger
    },
    get<T extends string>(prop: SystemProp): T | undefined {
        return getEnvVarOrReturnDefaultValue(prop) as T | undefined
    },

    getNumberOrThrow(prop: SystemProp): number {
        const value = system.getNumber(prop)

        if (isNil(value)) {
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
    getNumber(prop: SystemProp): number | null {
        const stringNumber = getEnvVarOrReturnDefaultValue(prop)

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
        const value = getEnvVarOrReturnDefaultValue(prop)

        if (isNil(value)) {
            return undefined
        }
        return value === 'true'
    },

    getList(prop: SystemProp): string[] {
        const values = getEnvVarOrReturnDefaultValue(prop)

        if (isNil(values)) {
            return []
        }
        return values.split(',').map((value) => value.trim())
    },

    getOrThrow<T extends string>(prop: SystemProp): T {
        const value = getEnvVarOrReturnDefaultValue(prop) as T | undefined

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
        return this.getOrThrow<ApEdition>(AppSystemProp.EDITION)
    },
    isWorker(): boolean {
        return [ContainerType.WORKER, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(WorkerSystemProp.CONTAINER_TYPE),
        )
    },
    isApp(): boolean {
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(WorkerSystemProp.CONTAINER_TYPE),
        )
    },
}

const getEnvVarOrReturnDefaultValue = (prop: SystemProp): string | undefined => {
    return environmentVariables.getEnvironment(prop) ?? systemPropDefaultValues[prop]
}
