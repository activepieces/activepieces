
import { redisHelper } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const DELETE_STALE_RUN_METADATA_KEY = 'delete_stale_run_metadata'

export const deleteStaleRunMetadata = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(DELETE_STALE_RUN_METADATA_KEY)
        if (!isNil(isMigrated)) {
            log.info('[deleteStaleRunMetadata] Already migrated, skipping')
            return
        }
        const keys = await redisHelper.scanAll(redisConnection, 'runs_metadata:*')
        log.info({ count: keys.length }, '[deleteStaleRunMetadata] Found stale run metadata keys')
        for (const key of keys) {
            await redisConnection.expire(key, dayjs.duration(10, 'minute').asSeconds())
        }
        await redisConnection.set(DELETE_STALE_RUN_METADATA_KEY, 'true')
    },
})
