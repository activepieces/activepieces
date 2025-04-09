import { Changelog } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../database/redis-connection'
import { SystemJobName } from '../helper/system-jobs/common'

export const changelogService = (_logger: FastifyBaseLogger) => ({
    async list(): Promise<Changelog> {
        const redis = getRedisConnection()
        const changelogs = await redis.get(SystemJobName.CHANGELOG)
        if (changelogs) {
            return JSON.parse(changelogs)
        }
        return {
            results: [],
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: 0,
        }
    },
})