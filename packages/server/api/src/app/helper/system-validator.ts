import { AppSystemProp, ContainerType, PiecesSource, SystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, ExecutionMode, FileLocation, isNil, PieceSyncMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { s3Helper } from '../file/s3-helper'
import { encryptUtils } from './encryption'
import { jwtUtils } from './jwt-utils'
import { DatabaseType, QueueMode, RedisType, system } from './system/system'


function enumValidator<T extends string>(enumValues: T[]) {
    return (value: string) => {
        const isValid = enumValues.includes(value as T)
        return isValid ? true : `Value must be one of: ${enumValues.join(', ')}`
    }
}

function booleanValidator(value: string | undefined) {
    const isValid = value === 'true' || value === 'false'
    return isValid ? true : 'Value must be either "true" or "false"'
}

function numberValidator(value: string | undefined) {
    const isValid = !isNil(value) && !Number.isNaN(Number(value))
    return isValid ? true : 'Value must be a valid number'
}

function stringValidator(value: string) {
    const isValid = typeof value === 'string' && value.length > 0
    return isValid ? true : 'Value must be a non-empty string'
}

function urlValidator(value: string) {
    try {
        new URL(value)
        return true
    }
    catch {
        return 'Value must be a valid URL'
    }
}

const systemPropValidators: {
    [key in SystemProp]: (value: string) => true | string
} = {
    // AppSystemProp
    [AppSystemProp.EXECUTION_MODE]: enumValidator(Object.values(ExecutionMode)),
    [AppSystemProp.LOG_LEVEL]: enumValidator(['error', 'warn', 'info', 'debug', 'trace']),
    [AppSystemProp.LOG_PRETTY]: booleanValidator,
    [AppSystemProp.ENVIRONMENT]: enumValidator(Object.values(ApEnvironment)),
    [AppSystemProp.TRIGGER_TIMEOUT_SECONDS]: numberValidator,
    [AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS]: numberValidator,
    [AppSystemProp.FLOW_TIMEOUT_SECONDS]: numberValidator,
    [AppSystemProp.AGENT_TIMEOUT_SECONDS]: numberValidator,
    [AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS]: numberValidator,
    [AppSystemProp.APP_WEBHOOK_SECRETS]: stringValidator,
    [AppSystemProp.MAX_FILE_SIZE_MB]: numberValidator,
    [AppSystemProp.SANDBOX_MEMORY_LIMIT]: numberValidator,
    [AppSystemProp.SANDBOX_PROPAGATED_ENV_VARS]: stringValidator,
    [AppSystemProp.PIECES_SOURCE]: enumValidator(Object.values(PiecesSource)),
    [AppSystemProp.SENTRY_DSN]: urlValidator,

    [AppSystemProp.LOKI_PASSWORD]: stringValidator,
    [AppSystemProp.LOKI_URL]: urlValidator,
    [AppSystemProp.LOKI_USERNAME]: stringValidator,

    [AppSystemProp.OTEL_ENABLED]: booleanValidator,
    [AppSystemProp.HYPERDX_TOKEN]: stringValidator,
    [WorkerSystemProp.FRONTEND_URL]: urlValidator,
    [WorkerSystemProp.CONTAINER_TYPE]: enumValidator(Object.values(ContainerType)),
    [WorkerSystemProp.WORKER_TOKEN]: stringValidator,
    // AppSystemProp
    [AppSystemProp.API_KEY]: stringValidator,
    [AppSystemProp.API_RATE_LIMIT_AUTHN_ENABLED]: booleanValidator,
    [AppSystemProp.API_RATE_LIMIT_AUTHN_MAX]: numberValidator,
    [AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW]: stringValidator,
    [AppSystemProp.CLIENT_REAL_IP_HEADER]: stringValidator,
    [AppSystemProp.CLOUD_AUTH_ENABLED]: booleanValidator,
    [AppSystemProp.CONFIG_PATH]: stringValidator,
    [AppSystemProp.DB_TYPE]: enumValidator(Object.values(DatabaseType)),
    [AppSystemProp.DEV_PIECES]: stringValidator,
    [AppSystemProp.ENCRYPTION_KEY]: stringValidator,
    [AppSystemProp.EXECUTION_DATA_RETENTION_DAYS]: numberValidator,
    [AppSystemProp.JWT_SECRET]: stringValidator,
    [AppSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT]: numberValidator,
    [AppSystemProp.PIECES_SYNC_MODE]: enumValidator(Object.values(PieceSyncMode)),
    [AppSystemProp.POSTGRES_DATABASE]: stringValidator,
    [AppSystemProp.POSTGRES_HOST]: stringValidator,
    [AppSystemProp.POSTGRES_PASSWORD]: stringValidator,
    [AppSystemProp.POSTGRES_PORT]: numberValidator,
    [AppSystemProp.POSTGRES_SSL_CA]: stringValidator,
    [AppSystemProp.POSTGRES_URL]: stringValidator,
    [AppSystemProp.POSTGRES_USERNAME]: stringValidator,
    [AppSystemProp.POSTGRES_USE_SSL]: booleanValidator,
    [AppSystemProp.POSTGRES_POOL_SIZE]: numberValidator,
    [AppSystemProp.PROJECT_RATE_LIMITER_ENABLED]: booleanValidator,
    [AppSystemProp.QUEUE_MODE]: enumValidator(Object.values(QueueMode)),
    [AppSystemProp.QUEUE_UI_ENABLED]: booleanValidator,
    [AppSystemProp.QUEUE_UI_PASSWORD]: stringValidator,
    [AppSystemProp.QUEUE_UI_USERNAME]: stringValidator,
    [AppSystemProp.REDIS_TYPE]: enumValidator(Object.values(RedisType)),
    [AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS]: numberValidator,
    [AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT]: numberValidator,
    [AppSystemProp.REDIS_SSL_CA_FILE]: stringValidator,
    [AppSystemProp.REDIS_DB]: numberValidator,
    [AppSystemProp.REDIS_HOST]: stringValidator,
    [AppSystemProp.REDIS_PASSWORD]: stringValidator,
    [AppSystemProp.REDIS_PORT]: numberValidator,
    [AppSystemProp.REDIS_URL]: stringValidator,
    [AppSystemProp.REDIS_USER]: stringValidator,
    [AppSystemProp.REDIS_USE_SSL]: booleanValidator,
    [AppSystemProp.REDIS_SENTINEL_ROLE]: stringValidator,
    [AppSystemProp.REDIS_SENTINEL_HOSTS]: stringValidator,
    [AppSystemProp.REDIS_SENTINEL_NAME]: stringValidator,
    [AppSystemProp.S3_ACCESS_KEY_ID]: stringValidator,
    [AppSystemProp.S3_BUCKET]: stringValidator,
    [AppSystemProp.S3_ENDPOINT]: stringValidator,
    [AppSystemProp.S3_REGION]: stringValidator,
    [AppSystemProp.S3_SECRET_ACCESS_KEY]: stringValidator,
    [AppSystemProp.S3_USE_SIGNED_URLS]: booleanValidator,
    [AppSystemProp.S3_USE_IRSA]: booleanValidator,
    [AppSystemProp.SMTP_HOST]: stringValidator,
    [AppSystemProp.SMTP_PASSWORD]: stringValidator,
    [AppSystemProp.SMTP_PORT]: numberValidator,
    [AppSystemProp.SMTP_SENDER_EMAIL]: (value: string) => value.includes('@') ? true : 'Value must be a valid email address',
    [AppSystemProp.SMTP_SENDER_NAME]: stringValidator,
    [AppSystemProp.SMTP_USERNAME]: stringValidator,
    [AppSystemProp.TELEMETRY_ENABLED]: booleanValidator,
    [AppSystemProp.TEMPLATES_SOURCE_URL]: stringValidator,
    [AppSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: numberValidator,
    [AppSystemProp.WEBHOOK_TIMEOUT_SECONDS]: numberValidator,
    [AppSystemProp.APPSUMO_TOKEN]: stringValidator,
    [AppSystemProp.FILE_STORAGE_LOCATION]: enumValidator(Object.values(FileLocation)),
    [AppSystemProp.FIREBASE_ADMIN_CREDENTIALS]: stringValidator,
    [AppSystemProp.FIREBASE_HASH_PARAMETERS]: stringValidator,
    [AppSystemProp.STRIPE_SECRET_KEY]: stringValidator,
    [AppSystemProp.STRIPE_WEBHOOK_SECRET]: stringValidator,
    [AppSystemProp.CLOUD_PLATFORM_ID]: stringValidator,
    [AppSystemProp.INTERNAL_URL]: stringValidator,
    [AppSystemProp.PM2_ENABLED]: booleanValidator,
    [AppSystemProp.EDITION]: enumValidator(Object.values(ApEdition)),
    [AppSystemProp.FEATUREBASE_API_KEY]: stringValidator,
    // Copilot
    [AppSystemProp.PERPLEXITY_BASE_URL]: urlValidator,

    // AppSystemProp
    [WorkerSystemProp.WORKER_CONCURRENCY]: numberValidator,

    // Cloud
    [AppSystemProp.GOOGLE_CLIENT_ID]: stringValidator,
    [AppSystemProp.GOOGLE_CLIENT_SECRET]: stringValidator,

    // Cloudflare
    [AppSystemProp.CLOUDFLARE_API_TOKEN]: stringValidator,
    [AppSystemProp.CLOUDFLARE_API_BASE]: stringValidator,
    [AppSystemProp.CLOUDFLARE_ZONE_ID]: stringValidator,

    // Secret Manager
    [AppSystemProp.SECRET_MANAGER_API_KEY]: stringValidator,

    // Custom
    [AppSystemProp.BOTX_URL]: urlValidator,
    [AppSystemProp.ZERO_SERVICE_URL]: urlValidator,
    [AppSystemProp.ZERO_PUBLIC_URL]: urlValidator,

    // Tables
    [AppSystemProp.MAX_RECORDS_PER_TABLE]: numberValidator,
    [AppSystemProp.MAX_FIELDS_PER_TABLE]: numberValidator,
    [AppSystemProp.SHOW_CHANGELOG]: booleanValidator,

    // MCP
    [AppSystemProp.ENABLE_FLOW_ON_PUBLISH]: booleanValidator,
    [AppSystemProp.ISSUE_ARCHIVE_DAYS]: (value: string) => {
        const days = parseInt(value)
        if (isNaN(days) || days < 0) {
            return 'Value must be a non-negative number'
        }
        return true
    },
}



const validateSystemPropTypes = () => {
    const systemProperties: SystemProp[] = [...Object.values(AppSystemProp), ...Object.values(AppSystemProp)]
    const errors: {
        [key in SystemProp]?: string
    } = {}

    for (const prop of systemProperties) {
        const value = system.get(prop)
        const onlyValidateIfValueIsSet = !isNil(value)
        if (onlyValidateIfValueIsSet) {
            const validationResult = systemPropValidators[prop](value)
            if (validationResult !== true) {
                errors[prop] = `Current value: ${value}. Expected: ${validationResult}`
            }
        }
    }
    return errors
}

export const validateEnvPropsOnStartup = async (log: FastifyBaseLogger): Promise<void> => {

    const environment = system.get(AppSystemProp.ENVIRONMENT)
    const fileStorageLocation = process.env.AP_FILE_STORAGE_LOCATION
    if (environment !== ApEnvironment.TESTING && fileStorageLocation === FileLocation.S3) {
        try {
            await s3Helper(log).validateS3Configuration()
        }
        catch (error: unknown) {
            throw new Error(JSON.stringify({
                message: 'S3 validation failed. Check your configuration and credentials.',
                docUrl: 'https://www.activepieces.com/docs/install/configuration/overview#configure-s3-optional',
            }))
        }
    }

    const errors = validateSystemPropTypes()
    if (Object.keys(errors).length > 0) {
        log.warn({
            errors,
        }, '[validateEnvPropsOnStartup]')
    }

    const codeSandboxType = process.env.AP_CODE_SANDBOX_TYPE
    if (!isNil(codeSandboxType)) {
        throw new Error(JSON.stringify({
            message: 'AP_CODE_SANDBOX_TYPE is deprecated, please use AP_EXECUTION_MODE instead',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/overview',
        }))
    }
    const encryptionKey = await encryptUtils.getEncryptionKey()
    const isValidHexKey = encryptionKey && /^[A-Za-z0-9]{32}$/.test(encryptionKey)
    if (!isValidHexKey) {
        throw new Error(JSON.stringify({
            message: 'AP_ENCRYPTION_KEY is missing or invalid. It must be a 32-character hexadecimal string (representing 16 bytes). You can generate one using the command: `openssl rand -hex 16`',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/environment-variables',
        }))
    }
    const isApp = system.isApp()
    if (isApp) {
        const rentionPeriod = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
        const maximumPausedFlowTimeout = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
        if (maximumPausedFlowTimeout > rentionPeriod) {
            throw new Error(JSON.stringify({
                message: 'AP_PAUSED_FLOW_TIMEOUT_DAYS can not exceed AP_EXECUTION_DATA_RETENTION_DAYS',
            }))
        }
    }

    const jwtSecret = await jwtUtils.getJwtSecret()
    if (isNil(jwtSecret)) {
        throw new Error(JSON.stringify({
            message: 'AP_JWT_SECRET is undefined, please define it in the environment variables',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/environment-variables',
        }))
    }

    const edition = system.getEdition()
    if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition) && environment === ApEnvironment.PRODUCTION) {
        const executionMode = system.getOrThrow<ExecutionMode>(AppSystemProp.EXECUTION_MODE)
        if (![ExecutionMode.SANDBOXED, ExecutionMode.SANDBOX_CODE_ONLY].includes(executionMode) ) {
            throw new Error(JSON.stringify({
                message: 'Execution mode UNSANDBOXED is no longer supported in this edition, check the documentation for recent changes',
                docUrl: 'https://www.activepieces.com/docs/install/configuration/overview',
            }))
        }
    }
}
