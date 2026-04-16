import { PresenceUser } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const PRESENCE_KEY_PREFIX = 'presence:'
const PRESENCE_TTL_SECONDS = 90

export const presenceService = (_log: FastifyBaseLogger) => ({
    async join({ resourceId, userId, userDisplayName, userEmail, userImageUrl }: JoinParams): Promise<void> {
        const redis = await redisConnections.useExisting()
        const key = PRESENCE_KEY_PREFIX + resourceId
        const value = JSON.stringify({ userId, userDisplayName, userEmail, userImageUrl, lastSeen: Date.now() })
        await redis.hset(key, userId, value)
        await redis.expire(key, PRESENCE_TTL_SECONDS)
    },

    async leave({ resourceId, userId }: LeaveParams): Promise<void> {
        const redis = await redisConnections.useExisting()
        const key = PRESENCE_KEY_PREFIX + resourceId
        await redis.hdel(key, userId)
    },

    async getActiveUsers({ resourceId }: GetActiveUsersParams): Promise<PresenceUser[]> {
        const redis = await redisConnections.useExisting()
        const key = PRESENCE_KEY_PREFIX + resourceId
        const entries = await redis.hgetall(key)
        const now = Date.now()
        const activeUsers: PresenceUser[] = []
        const staleUserIds: string[] = []

        for (const [userId, raw] of Object.entries(entries)) {
            const parsed: PresenceEntry = JSON.parse(raw)
            if (now - parsed.lastSeen > PRESENCE_TTL_SECONDS * 1000) {
                staleUserIds.push(userId)
            }
            else {
                activeUsers.push({
                    userId: parsed.userId,
                    userDisplayName: parsed.userDisplayName,
                    userEmail: parsed.userEmail,
                    userImageUrl: parsed.userImageUrl,
                })
            }
        }

        if (staleUserIds.length > 0) {
            await redis.hdel(key, ...staleUserIds)
        }

        return activeUsers
    },
})

type PresenceEntry = {
    userId: string
    userDisplayName: string
    userEmail: string
    userImageUrl: string | null
    lastSeen: number
}

type JoinParams = {
    resourceId: string
    userId: string
    userDisplayName: string
    userEmail: string
    userImageUrl: string | null
}

type LeaveParams = {
    resourceId: string
    userId: string
}

type GetActiveUsersParams = {
    resourceId: string
}
