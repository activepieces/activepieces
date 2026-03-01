import { ExecutionMode } from '@activepieces/shared'
import { DatabaseType } from './database-type'
import { RedisType } from './redis/types'
import { AppSystemProp } from './system-props'

const envPrefix = (prop: string): string => `AP_${prop}`

export const environmentMigrations = {
    migrate(): Record<string, string | undefined> {

        return {
            ...process.env,
            [envPrefix(AppSystemProp.EXECUTION_MODE)]: migrateExecutionMode(getRawValue(AppSystemProp.EXECUTION_MODE)),
            [envPrefix(AppSystemProp.REDIS_TYPE)]: migrateRedisType(getRawValue(AppSystemProp.REDIS_TYPE)),
            [envPrefix(AppSystemProp.DB_TYPE)]: migrateDbType(getRawValue(AppSystemProp.DB_TYPE)),
        }
    },
}

function migrateRedisType(currentRedisType: string | undefined): string | undefined {
    const queueMode = process.env['AP_QUEUE_MODE']
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

function getRawValue(prop: string): string | undefined {
    return process.env[envPrefix(prop)]
}
