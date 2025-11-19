import { ExecutionMode } from '@activepieces/shared'
import { RedisType } from './redis/types'
import { AppSystemProp, PiecesSource } from './system-props'

const envPrefix = (prop: string) => `AP_${prop}`

export const environmentMigrations = {
    migrate(): Record<string, string | undefined> {

        return {
            ...process.env,
            [envPrefix(AppSystemProp.PIECES_SOURCE)]: migratePiecesSource(getRawValue(AppSystemProp.PIECES_SOURCE)),
            [envPrefix(AppSystemProp.EXECUTION_MODE)]: migrateExecutionMode(getRawValue(AppSystemProp.EXECUTION_MODE)),
            [envPrefix(AppSystemProp.REDIS_TYPE)]: migrateRedisType(getRawValue(AppSystemProp.REDIS_TYPE)),
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

function migratePiecesSource(currentPiecesSource: string | undefined): string | undefined {
    if (currentPiecesSource === 'CLOUD_AND_DB') {
        return PiecesSource.DB
    }
    return currentPiecesSource
}

function getRawValue(prop: string): string | undefined {
    return process.env[envPrefix(prop)]
}
