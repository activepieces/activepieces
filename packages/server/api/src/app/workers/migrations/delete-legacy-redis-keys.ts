
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { redisHelper } from '../../database/redis'
import { redisConnections } from '../../database/redis-connections'

const DELETE_LEGACY_REDIS_KEYS_KEY = 'delete_legacy_redis_keys'

const LEGACY_PATTERNS = [
    'tasks:project:*',
    'tasks:platform:*',
    'project-usage:*',
    'project-*-usage-tasks:*',
]

export const deleteLegacyRedisKeys = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(DELETE_LEGACY_REDIS_KEYS_KEY)
        if (!isNil(isMigrated)) {
            log.info('[deleteLegacyRedisKeys] Already migrated, skipping')
            return
        }
        for (const pattern of LEGACY_PATTERNS) {
            const keys = await redisHelper.scanAll(redisConnection, pattern)
            log.info({ pattern, count: keys.length }, '[deleteLegacyRedisKeys] Found legacy keys')
            const BATCH_SIZE = 1000
            for (let i = 0; i < keys.length; i += BATCH_SIZE) {
                await redisConnection.del(...keys.slice(i, i + BATCH_SIZE))
            }
        }
        await redisConnection.set(DELETE_LEGACY_REDIS_KEYS_KEY, 'true')
    },
})
