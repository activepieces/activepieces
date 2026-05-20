import { ACTIVEPIECES_CHAT_TIERS, ApEdition, ChatConversation, chunk, PersistedChatMessage, PersistedChatPartType, PersistedToolCallStatus, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'

const CONSOLE_TELEMETRY_URL = 'https://console.activepieces.com/api/chat-analytics/external/sync'
const CONSOLE_API_KEY = system.get(AppSystemProp.CONSOLE_API_SECRET_KEY)
const BATCH_SIZE = 50

export const chatAnalyticsTelemetry = (log: FastifyBaseLogger) => ({
    sendConversationUpdate({ conversation }: {
        conversation: ChatConversation
    }): void {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }

        rejectedPromiseHandler(pushToConsole({ conversations: [conversation], log }), log)
    },
})

export const chatAnalyticsBulkSync = (log: FastifyBaseLogger) => ({
    async syncAll({ conversations }: {
        conversations: ChatConversation[]
    }): Promise<{ synced: number, failed: number }> {
        const userCache = new Map<string, string | null>()
        const platformCache = new Map<string, string | null>()

        await preResolveLookups({ conversations, userCache, platformCache, log })

        let synced = 0
        let failed = 0

        for (const batch of chunk(conversations, BATCH_SIZE)) {
            const success = await pushToConsole({ conversations: batch, log, userCache, platformCache })
            if (success) {
                synced += batch.length
            }
            else {
                failed += batch.length
            }
        }

        return { synced, failed }
    },
})

async function preResolveLookups({ conversations, userCache, platformCache, log }: {
    conversations: ChatConversation[]
    userCache: Map<string, string | null>
    platformCache: Map<string, string | null>
    log: FastifyBaseLogger
}): Promise<void> {
    const uniqueUserIds = [...new Set(conversations.map((c) => c.userId))]
    const uniquePlatformIds = [...new Set(conversations.map((c) => c.platformId))]

    await Promise.all([
        ...uniqueUserIds.map(async (userId) => {
            userCache.set(userId, await resolveUserEmail({ userId, log }))
        }),
        ...uniquePlatformIds.map(async (platformId) => {
            platformCache.set(platformId, await resolvePlatformName({ platformId, log }))
        }),
    ])
}

async function pushToConsole({ conversations, log, userCache, platformCache }: {
    conversations: ChatConversation[]
    log: FastifyBaseLogger
    userCache?: Map<string, string | null>
    platformCache?: Map<string, string | null>
}): Promise<boolean> {
    if (!CONSOLE_API_KEY) {
        return false
    }

    const payloads = await Promise.all(
        conversations.map((conversation) => toSyncPayload({ conversation, log, userCache, platformCache })),
    )

    const result = await tryCatch(() => fetch(CONSOLE_TELEMETRY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONSOLE_API_KEY}`,
        },
        body: JSON.stringify({ conversations: payloads }),
        signal: AbortSignal.timeout(30000),
    }))

    if (result.error) {
        log.error({ error: result.error }, 'Failed to push chat analytics telemetry')
        return false
    }
    if (!result.data.ok) {
        log.error({ status: result.data.status }, 'Failed to push chat analytics telemetry: non-2xx response')
        return false
    }
    return true
}

async function toSyncPayload({ conversation, log, userCache, platformCache }: {
    conversation: ChatConversation
    log: FastifyBaseLogger
    userCache?: Map<string, string | null>
    platformCache?: Map<string, string | null>
}): Promise<Record<string, unknown>> {
    const userEmail = userCache?.get(conversation.userId) ?? await resolveUserEmail({ userId: conversation.userId, log })
    const platformName = platformCache?.get(conversation.platformId) ?? await resolvePlatformName({ platformId: conversation.platformId, log })

    return {
        id: conversation.id,
        platformId: conversation.platformId,
        platformName,
        userId: conversation.userId,
        userEmail,
        title: conversation.title,
        modelName: resolveModelLabel(conversation.modelName ?? null),
        messages: conversation.uiMessages ?? [],
        messageCount: conversation.uiMessages?.length ?? 0,
        toolCallsSummary: extractToolCallsSummary(conversation.uiMessages ?? []),
        isActive: false,
        createdAt: conversation.created,
        updatedAt: conversation.updated,
    }
}

function resolveModelLabel(tierId: string | null): string | null {
    if (!tierId) return null
    const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
    if (!tier) return tierId
    const modelShort = tier.modelId.split('/').pop() ?? tier.modelId
    return `${tier.label} (${modelShort})`
}

function extractToolCallsSummary(messages: PersistedChatMessage[]): Array<{ name: string, successCount: number, failureCount: number }> | null {
    const usage: Record<string, { successCount: number, failureCount: number }> = {}

    for (const msg of messages) {
        for (const part of msg.parts) {
            if (part.type !== PersistedChatPartType.TOOL_CALL) continue

            const name = part.toolName
            if (!usage[name]) {
                usage[name] = { successCount: 0, failureCount: 0 }
            }
            if (part.status === PersistedToolCallStatus.COMPLETED) {
                usage[name].successCount++
            }
            else {
                usage[name].failureCount++
            }
        }
    }

    const entries = Object.entries(usage).map(([name, counts]) => ({ name, ...counts }))
    return entries.length > 0 ? entries : null
}

async function resolveUserEmail({ userId, log }: { userId: string, log: FastifyBaseLogger }): Promise<string | null> {
    const result = await tryCatch(() => userService(log).getMetaInformation({ id: userId }))
    return result.error ? null : result.data.email
}

async function resolvePlatformName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string | null> {
    const result = await tryCatch(() => platformService(log).getOneOrThrow(platformId))
    return result.error ? null : result.data.name
}
