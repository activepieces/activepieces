import { ExecutionMode } from '@activepieces/shared'
import { DatabaseType } from './database-type'
import { RedisType } from './redis-type'

const ENV_VAR_NAMES = {
    EXECUTION_MODE: 'AP_EXECUTION_MODE',
    REDIS_TYPE: 'AP_REDIS_TYPE',
    DB_TYPE: 'AP_DB_TYPE',
    QUEUE_MODE: 'AP_QUEUE_MODE',
}

export const environmentMigrations = {
    migrate(name: string): string | undefined {
        switch (name) {
            case ENV_VAR_NAMES.EXECUTION_MODE: return migrateExecutionMode(process.env[name])
            case ENV_VAR_NAMES.REDIS_TYPE: return migrateRedisType(process.env[name])
            case ENV_VAR_NAMES.DB_TYPE: return migrateDbType(process.env[name])
            default: return process.env[name]
        }
    },
}

function migrateRedisType(currentRedisType: string | undefined): string | undefined {
    const queueMode = process.env[ENV_VAR_NAMES.QUEUE_MODE]
    if (queueMode === 'MEMORY') {
        return RedisType.MEMORY
    }
    return currentRedisType
}

function migrateExecutionMode(currentExecutionMode: string | undefined): string | undefined {
    if (currentExecutionMode === 'SANDBOXED') {
        return ExecutionMode.SANDBOX_PROCESS
    }
    return currentExecutionMode
}

function migrateDbType(currentDbType: string | undefined): string | undefined {
    if (currentDbType === 'SQLITE3') {
        return DatabaseType.PGLITE
    }
    return currentDbType
}
