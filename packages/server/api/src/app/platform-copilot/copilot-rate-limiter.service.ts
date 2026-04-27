import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { redisConnections } from '../database/redis-connections'

dayjs.extend(utc)
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const COUNTER_TTL_SECONDS = 36 * 60 * 60

const today = (): string => dayjs().utc().format('YYYY-MM-DD')
const thisHour = (): string => dayjs().utc().format('YYYY-MM-DD-HH')

const messagesKey = (platformId: string): string => `copilot:platform:${platformId}:messages:${today()}`
const tokensKey = (platformId: string): string => `copilot:platform:${platformId}:tokens:${today()}`
const globalCentsKey = (): string => `copilot:global:cents:${today()}`
const userMessagesKey = ({ platformId, userId }: { platformId: string, userId: string }): string => `copilot:user:${platformId}:${userId}:messages:${thisHour()}`

const readCounter = async (key: string): Promise<number> => {
    const redis = await redisConnections.useExisting()
    const value = await redis.get(key)
    return value ? Number.parseInt(value, 10) : 0
}

const incrementCounter = async ({ key, by }: { key: string, by: number }): Promise<number> => {
    const redis = await redisConnections.useExisting()
    const results = await redis
        .pipeline()
        .incrby(key, by)
        .expire(key, COUNTER_TTL_SECONDS)
        .exec()
    const incrResult = results?.[0]?.[1]
    return typeof incrResult === 'number' ? incrResult : 0
}

const secondsUntilUtcMidnight = (): number => {
    const now = dayjs().utc()
    const tomorrow = now.endOf('day').add(1, 'millisecond')
    return tomorrow.diff(now, 'second')
}

export const copilotRateLimiter = {
    async checkAndRecordUserAllowance({ platformId, userId }: { platformId: string, userId: string }): Promise<{ allowed: true } | { allowed: false, retryAfterSeconds: number }> {
        const cap = USER_MESSAGES_PER_HOUR
        const current = await readCounter(userMessagesKey({ platformId, userId }))
        if (current >= cap) {
            return { allowed: false, retryAfterSeconds: 60 * 60 }
        }
        await incrementCounter({ key: userMessagesKey({ platformId, userId }), by: 1 })
        return { allowed: true }
    },

    async checkPlatformAllowance(platformId: string): Promise<{ allowed: true } | { allowed: false, reason: 'platform_messages' | 'platform_tokens', retryAfterSeconds: number }> {
        const messagesCap = system.getNumberOrThrow(AppSystemProp.COPILOT_PER_PLATFORM_MESSAGES_PER_DAY)
        const tokensCap = system.getNumberOrThrow(AppSystemProp.COPILOT_PER_PLATFORM_TOKENS_PER_DAY)

        const [messages, tokens] = await Promise.all([
            readCounter(messagesKey(platformId)),
            readCounter(tokensKey(platformId)),
        ])

        if (messages >= messagesCap) {
            return { allowed: false, reason: 'platform_messages', retryAfterSeconds: secondsUntilUtcMidnight() }
        }
        if (tokens >= tokensCap) {
            return { allowed: false, reason: 'platform_tokens', retryAfterSeconds: secondsUntilUtcMidnight() }
        }
        return { allowed: true }
    },

    async checkGlobalAllowance(): Promise<{ allowed: true } | { allowed: false, retryAfterSeconds: number }> {
        const usdCap = system.getNumberOrThrow(AppSystemProp.COPILOT_DAILY_GLOBAL_USD_CAP)
        const currentCents = await readCounter(globalCentsKey())
        if (currentCents >= usdCap * 100) {
            return { allowed: false, retryAfterSeconds: secondsUntilUtcMidnight() }
        }
        return { allowed: true }
    },

    async recordPlatformMessage(platformId: string): Promise<void> {
        await incrementCounter({ key: messagesKey(platformId), by: 1 })
    },

    async recordPlatformTokens({ platformId, totalTokens }: { platformId: string, totalTokens: number }): Promise<void> {
        if (totalTokens <= 0) return
        await incrementCounter({ key: tokensKey(platformId), by: totalTokens })
    },

    async recordGlobalCost(usageCents: number): Promise<void> {
        if (usageCents <= 0) return
        await incrementCounter({ key: globalCentsKey(), by: usageCents })
    },
}

export const estimateUsageCents = ({ inputTokens, outputTokens }: { inputTokens: number, outputTokens: number }): number => {
    const inputCost = (inputTokens / 1_000_000) * INPUT_USD_PER_1M
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_USD_PER_1M
    return Math.ceil((inputCost + outputCost) * 100)
}

const INPUT_USD_PER_1M = 2.5
const OUTPUT_USD_PER_1M = 10
const USER_MESSAGES_PER_HOUR = 30
