import { assertNotNullOrUndefined } from '@activepieces/shared'
import axios from 'axios'

export const systemConstants = {
    PACKAGE_ARCHIVE_PATH: 'cache/archives',
    ENGINE_EXECUTABLE_PATH: 'dist/packages/engine/main.js',
}

export type SystemProp = AppSystemProp | WorkerSystemProp

let cachedVersion: string | undefined

export enum AppSystemProp {
    API_KEY = 'API_KEY',
    API_RATE_LIMIT_AUTHN_ENABLED = 'API_RATE_LIMIT_AUTHN_ENABLED',
    API_RATE_LIMIT_AUTHN_MAX = 'API_RATE_LIMIT_AUTHN_MAX',
    API_RATE_LIMIT_AUTHN_WINDOW = 'API_RATE_LIMIT_AUTHN_WINDOW',
    CLIENT_REAL_IP_HEADER = 'CLIENT_REAL_IP_HEADER',
    CLOUD_AUTH_ENABLED = 'CLOUD_AUTH_ENABLED',
    CONFIG_PATH = 'CONFIG_PATH',
    DB_TYPE = 'DB_TYPE',
    DEV_PIECES = 'DEV_PIECES',
    ENCRYPTION_KEY = 'ENCRYPTION_KEY',
    EXECUTION_DATA_RETENTION_DAYS = 'EXECUTION_DATA_RETENTION_DAYS',
    JWT_SECRET = 'JWT_SECRET',
    INTERNAL_URL = 'INTERNAL_URL',

    MAX_CONCURRENT_JOBS_PER_PROJECT = 'MAX_CONCURRENT_JOBS_PER_PROJECT',
    PERPLEXITY_BASE_URL = 'PERPLEXITY_BASE_URL',
    PIECES_SYNC_MODE = 'PIECES_SYNC_MODE',
    POSTGRES_DATABASE = 'POSTGRES_DATABASE',
    POSTGRES_HOST = 'POSTGRES_HOST',
    POSTGRES_PASSWORD = 'POSTGRES_PASSWORD',
    POSTGRES_PORT = 'POSTGRES_PORT',
    POSTGRES_SSL_CA = 'POSTGRES_SSL_CA',
    POSTGRES_URL = 'POSTGRES_URL',
    POSTGRES_USERNAME = 'POSTGRES_USERNAME',
    POSTGRES_USE_SSL = 'POSTGRES_USE_SSL',
    POSTGRES_POOL_SIZE = 'POSTGRES_POOL_SIZE',
    PROJECT_RATE_LIMITER_ENABLED = 'PROJECT_RATE_LIMITER_ENABLED',
    /**
     * @deprecated Use REDIS_TYPE instead
     */
    QUEUE_MODE = 'QUEUE_MODE',
    QUEUE_UI_ENABLED = 'QUEUE_UI_ENABLED',
    QUEUE_UI_PASSWORD = 'QUEUE_UI_PASSWORD',
    QUEUE_UI_USERNAME = 'QUEUE_UI_USERNAME',
    REDIS_TYPE = 'REDIS_TYPE',
    REDIS_SSL_CA_FILE = 'REDIS_SSL_CA_FILE',
    REDIS_DB = 'REDIS_DB',
    REDIS_HOST = 'REDIS_HOST',
    REDIS_PASSWORD = 'REDIS_PASSWORD',
    REDIS_PORT = 'REDIS_PORT',
    REDIS_URL = 'REDIS_URL',
    REDIS_USER = 'REDIS_USER',
    REDIS_USE_SSL = 'REDIS_USE_SSL',
    REDIS_SENTINEL_ROLE = 'REDIS_SENTINEL_ROLE',
    REDIS_SENTINEL_HOSTS = 'REDIS_SENTINEL_HOSTS',
    REDIS_SENTINEL_NAME = 'REDIS_SENTINEL_NAME',
    REDIS_FAILED_JOB_RETENTION_DAYS = 'REDIS_FAILED_JOB_RETENTION_DAYS',
    REDIS_FAILED_JOB_RETENTION_MAX_COUNT = 'REDIS_FAILED_JOB_RETENTION_MAX_COUNT',
    S3_ACCESS_KEY_ID = 'S3_ACCESS_KEY_ID',
    S3_BUCKET = 'S3_BUCKET',
    S3_ENDPOINT = 'S3_ENDPOINT',
    S3_REGION = 'S3_REGION',
    S3_SECRET_ACCESS_KEY = 'S3_SECRET_ACCESS_KEY',
    S3_USE_SIGNED_URLS = 'S3_USE_SIGNED_URLS',
    S3_USE_IRSA = 'S3_USE_IRSA',
    SMTP_HOST = 'SMTP_HOST',
    SMTP_PASSWORD = 'SMTP_PASSWORD',
    SMTP_PORT = 'SMTP_PORT',
    SMTP_SENDER_EMAIL = 'SMTP_SENDER_EMAIL',
    SMTP_SENDER_NAME = 'SMTP_SENDER_NAME',
    SMTP_USERNAME = 'SMTP_USERNAME',
    TELEMETRY_ENABLED = 'TELEMETRY_ENABLED',
    TEMPLATES_SOURCE_URL = 'TEMPLATES_SOURCE_URL',
    TRIGGER_DEFAULT_POLL_INTERVAL = 'TRIGGER_DEFAULT_POLL_INTERVAL',
    WEBHOOK_TIMEOUT_SECONDS = 'WEBHOOK_TIMEOUT_SECONDS',
    FEATUREBASE_API_KEY = 'FEATUREBASE_API_KEY',
    SHOW_CHANGELOG = 'SHOW_CHANGELOG',
    ENABLE_FLOW_ON_PUBLISH = 'ENABLE_FLOW_ON_PUBLISH',

    ISSUE_ARCHIVE_DAYS = 'ISSUE_ARCHIVE_DAYS',

    // ENTERPRISE ONLY
    APPSUMO_TOKEN = 'APPSUMO_TOKEN',
    FILE_STORAGE_LOCATION = 'FILE_STORAGE_LOCATION',
    FIREBASE_ADMIN_CREDENTIALS = 'FIREBASE_ADMIN_CREDENTIALS',
    FIREBASE_HASH_PARAMETERS = 'FIREBASE_HASH_PARAMETERS',
    STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY',
    STRIPE_WEBHOOK_SECRET = 'STRIPE_WEBHOOK_SECRET',

    // CLOUD_ONLY
    CLOUD_PLATFORM_ID = 'CLOUD_PLATFORM_ID',
    GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID',
    GOOGLE_CLIENT_SECRET = 'GOOGLE_CLIENT_SECRET',
    EDITION = 'EDITION',

    TRIGGER_TIMEOUT_SECONDS = 'TRIGGER_TIMEOUT_SECONDS',
    TRIGGER_HOOKS_TIMEOUT_SECONDS = 'TRIGGER_HOOKS_TIMEOUT_SECONDS',
    PAUSED_FLOW_TIMEOUT_DAYS = 'PAUSED_FLOW_TIMEOUT_DAYS',
    EXECUTION_MODE = 'EXECUTION_MODE',
    FLOW_TIMEOUT_SECONDS = 'FLOW_TIMEOUT_SECONDS',
    AGENT_TIMEOUT_SECONDS = 'AGENT_TIMEOUT_SECONDS',

    LOG_LEVEL = 'LOG_LEVEL',
    LOG_PRETTY = 'LOG_PRETTY',
    ENVIRONMENT = 'ENVIRONMENT',
    APP_WEBHOOK_SECRETS = 'APP_WEBHOOK_SECRETS',
    MAX_FILE_SIZE_MB = 'MAX_FILE_SIZE_MB',

    SANDBOX_MEMORY_LIMIT = 'SANDBOX_MEMORY_LIMIT',
    SANDBOX_PROPAGATED_ENV_VARS = 'SANDBOX_PROPAGATED_ENV_VARS',
    PIECES_SOURCE = 'PIECES_SOURCE',

    // Cloud Only & Enterprise Only
    SENTRY_DSN = 'SENTRY_DSN',
    LOKI_PASSWORD = 'LOKI_PASSWORD',
    LOKI_URL = 'LOKI_URL',
    LOKI_USERNAME = 'LOKI_USERNAME',

    // OpenTelemetry
    OTEL_ENABLED = 'OTEL_ENABLED',
    HYPERDX_TOKEN = 'HYPERDX_TOKEN',

    // Cloudflare
    CLOUDFLARE_API_TOKEN = 'CLOUDFLARE_API_TOKEN',
    CLOUDFLARE_API_BASE = 'CLOUDFLARE_API_BASE',
    CLOUDFLARE_ZONE_ID = 'CLOUDFLARE_ZONE_ID',
    // Secret Manager
    SECRET_MANAGER_API_KEY = 'SECRET_MANAGER_API_KEY',

    // Custom
    BOTX_URL = 'BOTX_URL',
    ZERO_SERVICE_URL = 'ZERO_SERVICE_URL',
    ZERO_PUBLIC_URL = 'ZERO_PUBLIC_URL',

    // Tables
    MAX_RECORDS_PER_TABLE = 'MAX_RECORDS_PER_TABLE',
    MAX_FIELDS_PER_TABLE = 'MAX_FIELDS_PER_TABLE',

    PM2_ENABLED = 'PM2_ENABLED',

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
    WORKER_TOKEN = 'WORKER_TOKEN',
    CONTAINER_TYPE = 'CONTAINER_TYPE',
    FRONTEND_URL = 'FRONTEND_URL',

    // Optional
    WORKER_CONCURRENCY = 'WORKER_CONCURRENCY',
}


export const environmentVariables = {
    hasAppModules(): boolean {
        const environment = this.getEnvironment(WorkerSystemProp.CONTAINER_TYPE) ?? ContainerType.WORKER_AND_APP
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(environment as ContainerType)
    },
    getNumberEnvironment: (prop: WorkerSystemProp): number | undefined => {
        const value = environmentVariables.getEnvironment(prop)
        return value ? parseInt(value) : undefined
    },
    getEnvironment: (prop: WorkerSystemProp | AppSystemProp): string | undefined => {
        return process.env[`AP_${prop}`]
    },
    getEnvironmentOrThrow: (prop: WorkerSystemProp): string => {
        const value = environmentVariables.getEnvironment(prop)
        assertNotNullOrUndefined(value, `Environment variable ${prop} is not set`)
        return value
    },
}

export const apVersionUtil = {
    async getCurrentRelease(): Promise<string> {
        // eslint-disable-next-line @nx/enforce-module-boundaries
        const packageJson = await import('package.json')
        return packageJson.version
    },
    async getLatestRelease(): Promise<string> {
        try {
            if (cachedVersion) {
                return cachedVersion
            }
            const response = await axios.get<PackageJson>(
                'https://raw.githubusercontent.com/activepieces/activepieces/main/package.json',
                {
                    timeout: 5000,
                },
            )
            cachedVersion = response.data.version
            return response.data.version
        }
        catch (ex) {
            return '0.0.0'
        }
    },
}

type PackageJson = {
    version: string
}
