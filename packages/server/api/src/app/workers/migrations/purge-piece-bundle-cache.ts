import { isNil, tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { s3Helper } from '../../file/s3-helper'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

const PURGE_PIECE_BUNDLE_CACHE_KEY = 'purge_piece_bundle_cache_v1'
const PIECES_PREFIX = 'pieces/'

export const purgePieceBundleCache = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const purged = await redisConnection.get(PURGE_PIECE_BUNDLE_CACHE_KEY)
        if (!isNil(purged)) {
            return
        }
        if (isNil(system.get(AppSystemProp.S3_BUCKET))) {
            await redisConnection.set(PURGE_PIECE_BUNDLE_CACHE_KEY, 'true')
            return
        }
        const s3 = s3Helper(log)
        const { data: keys, error: listError } = await tryCatch(() => s3.listKeys(PIECES_PREFIX))
        if (listError) {
            log.warn({ error: listError }, '[purgePieceBundleCache] Failed to list cached piece tarballs, will retry on next boot')
            return
        }
        log.info({ count: keys.length }, '[purgePieceBundleCache] Purging cached piece tarballs so repackaged bundles are re-fetched')
        const { data: failedKeys, error: deleteError } = await tryCatch(() => s3.deleteFiles(keys))
        if (deleteError) {
            log.warn({ error: deleteError }, '[purgePieceBundleCache] Failed to purge cached piece tarballs, will retry on next boot')
            return
        }
        // Only a fully empty prefix may be marked done — a partial purge that recorded success
        // would leave unbundled tarballs shadowing the CDN with no way to retry.
        if (failedKeys.length > 0) {
            log.warn({ failedCount: failedKeys.length, total: keys.length }, '[purgePieceBundleCache] Purge incomplete, will retry on next boot')
            return
        }
        await redisConnection.set(PURGE_PIECE_BUNDLE_CACHE_KEY, 'true')
        log.info({ count: keys.length }, '[purgePieceBundleCache] Purge completed')
    },
})
