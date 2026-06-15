import { ACTIVEPIECES_CHAT_TIERS, AIProviderName, ApEdition, ChatConversation, ChatHistoryMessage, chunk, isNil, PersistedChatMessage, PersistedChatPart, PersistedChatPartType, PersistedChatRole, PersistedToolCallStatus, tryCatch } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { platformPlanRepo } from '../platform/platform-plan/platform-plan.service'
import { chatHelpers } from './chat-helpers'
import { chatHistory } from './history/chat-history'

const CONSOLE_TELEMETRY_URL = 'https://console.activepieces.com/api/chat-analytics/external/sync'
const BATCH_SIZE = 50
const REQUEST_TIMEOUT_MS = 30000

export const chatAnalyticsTelemetry = (log: FastifyBaseLogger) => ({
    sendConversationUpdate({ conversation }: {
        conversation: ChatConversation
    }): void {
        rejectedPromiseHandler(syncConversations({ conversations: [conversation], log }), log)
    },
})

export const chatAnalyticsBulkSync = (log: FastifyBaseLogger) => ({
    async syncAll({ conversations }: {
        conversations: ChatConversation[]
    }): Promise<{ synced: number, failed: number }> {
        const result = await syncConversations({ conversations, log })
        return { synced: result.pushed, failed: result.skipped + result.failed }
    },
})

// Chat analytics ships full conversation content, so it is Cloud-only. On Cloud each platform's
// conversations are synced under that platform's license key (sent as the Bearer token); platforms
// without a license key are skipped.
async function syncConversations({ conversations, log }: {
    conversations: ChatConversation[]
    log: FastifyBaseLogger
}): Promise<{ pushed: number, skipped: number, failed: number }> {
    if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
        return { pushed: 0, skipped: conversations.length, failed: 0 }
    }

    if (conversations.length === 0) {
        return { pushed: 0, skipped: 0, failed: 0 }
    }

    const platformIds = [...new Set(conversations.map((c) => c.platformId))]
    const licenseKeyByPlatform = await resolveLicenseKeysByPlatform({ platformIds })

    if (licenseKeyByPlatform.size === 0) {
        return { pushed: 0, skipped: conversations.length, failed: 0 }
    }

    const { userCache, platformCache, providerCache } = await resolveLookups({ conversations, log })

    const syncable = conversations.flatMap((conversation) => {
        const licenseKey = licenseKeyByPlatform.get(conversation.platformId)
        return isNil(licenseKey) ? [] : [{ conversation, licenseKey }]
    })
    let skipped = conversations.length - syncable.length

    const platformGroups = new Map<string, { licenseKey: string, conversations: ChatConversation[] }>()
    for (const { conversation, licenseKey } of syncable) {
        const group = platformGroups.get(conversation.platformId)
        if (isNil(group)) {
            platformGroups.set(conversation.platformId, { licenseKey, conversations: [conversation] })
        }
        else {
            group.conversations.push(conversation)
        }
    }

    let pushed = 0
    let failed = 0
    for (const { licenseKey, conversations: platformConversations } of platformGroups.values()) {
        for (const batch of chunk(platformConversations, BATCH_SIZE)) {
            const result = await pushBatch({ conversations: batch, licenseKey, log, userCache, platformCache, providerCache })
            pushed += result.pushed
            skipped += result.skipped
            if (!result.success) {
                failed += batch.length - result.skipped
            }
        }
    }

    return { pushed, skipped, failed }
}

async function resolveLicenseKeysByPlatform({ platformIds }: {
    platformIds: string[]
}): Promise<Map<string, string>> {
    if (platformIds.length === 0) {
        return new Map()
    }

    const rows = await platformPlanRepo()
        .createQueryBuilder('platform_plan')
        .select('platform_plan.platformId', 'platformId')
        .addSelect('platform_plan.licenseKey', 'licenseKey')
        .where('platform_plan.platformId IN (:...platformIds)', { platformIds })
        .andWhere('platform_plan.licenseKey IS NOT NULL')
        .getRawMany<{ platformId: string, licenseKey: string }>()

    const map = new Map<string, string>()
    for (const row of rows) {
        map.set(row.platformId, row.licenseKey)
    }
    return map
}

async function resolveLookups({ conversations, log }: {
    conversations: ChatConversation[]
    log: FastifyBaseLogger
}): Promise<ConversationLookups> {
    const uniqueUserIds = [...new Set(conversations.map((c) => c.userId))]
    const uniquePlatformIds = [...new Set(conversations.map((c) => c.platformId))]

    const [userEntries, platformNameEntries, providerEntries] = await Promise.all([
        Promise.all(uniqueUserIds.map(async (userId): Promise<[string, string | null]> => [userId, await resolveUserEmail({ userId, log })])),
        Promise.all(uniquePlatformIds.map(async (platformId): Promise<[string, string | null]> => [platformId, await resolvePlatformName({ platformId, log })])),
        Promise.all(uniquePlatformIds.map(async (platformId): Promise<[string, AIProviderName | null]> => [platformId, await resolveChatProviderName({ platformId, log })])),
    ])

    return {
        userCache: new Map(userEntries),
        platformCache: new Map(platformNameEntries),
        providerCache: new Map(providerEntries),
    }
}

async function pushBatch({ conversations, licenseKey, log, userCache, platformCache, providerCache }: {
    conversations: ChatConversation[]
    licenseKey: string
    log: FastifyBaseLogger
    userCache?: Map<string, string | null>
    platformCache?: Map<string, string | null>
    providerCache?: Map<string, AIProviderName | null>
}): Promise<{ pushed: number, skipped: number, success: boolean }> {
    const payloads: Record<string, unknown>[] = []
    for (const conversation of conversations) {
        const payloadResult = await tryCatch(() => toSyncPayload({ conversation, log, userCache, platformCache, providerCache }))
        if (payloadResult.error) {
            log.error({ conversationId: conversation.id, error: String(payloadResult.error) }, 'Failed to build sync payload for conversation, skipping')
            continue
        }
        payloads.push(payloadResult.data)
    }

    const skipped = conversations.length - payloads.length

    if (payloads.length === 0) {
        return { pushed: 0, skipped, success: true }
    }

    const result = await tryCatch(() => fetch(CONSOLE_TELEMETRY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${licenseKey}`,
        },
        body: JSON.stringify({ conversations: payloads }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }))

    if (result.error) {
        log.error({ error: result.error }, 'Failed to push chat analytics telemetry')
        return { pushed: 0, skipped, success: false }
    }
    if (!result.data.ok) {
        const body = await tryCatch(() => result.data.text())
        log.error({ status: result.data.status, body: body.error ? 'unreadable' : body.data }, 'Failed to push chat analytics telemetry: non-2xx response')
        return { pushed: 0, skipped, success: false }
    }
    return { pushed: payloads.length, skipped, success: true }
}

async function toSyncPayload({ conversation, log, userCache, platformCache, providerCache }: {
    conversation: ChatConversation
    log: FastifyBaseLogger
    userCache?: Map<string, string | null>
    platformCache?: Map<string, string | null>
    providerCache?: Map<string, AIProviderName | null>
}): Promise<Record<string, unknown>> {
    const userEmail = userCache?.get(conversation.userId) ?? await resolveUserEmail({ userId: conversation.userId, log })
    const platformName = platformCache?.get(conversation.platformId) ?? await resolvePlatformName({ platformId: conversation.platformId, log })
    const provider = providerCache?.get(conversation.platformId) ?? await resolveChatProviderName({ platformId: conversation.platformId, log })

    const messages = resolveMessages(conversation)

    return {
        id: conversation.id,
        platformId: conversation.platformId,
        platformName,
        userId: conversation.userId,
        userEmail,
        title: conversation.title,
        modelName: resolveModelId({ tierId: conversation.modelName ?? null, provider }),
        provider,
        messages,
        messageCount: messages.length,
        toolCallsSummary: extractToolCallsSummary(messages),
        isActive: false,
        createdAt: conversation.created,
        updatedAt: conversation.updated,
    }
}

function resolveMessages(conversation: ChatConversation): PersistedChatMessage[] {
    if (!isNil(conversation.uiMessages) && conversation.uiMessages.length > 0) {
        return conversation.uiMessages
    }
    const rawMessages = conversation.messages as ModelMessage[]
    if (isNil(rawMessages) || rawMessages.length === 0) {
        return []
    }
    return convertToPersistedFormat(chatHistory.reconstruct(rawMessages))
}

function convertToPersistedFormat(messages: ChatHistoryMessage[]): PersistedChatMessage[] {
    return messages.map((msg) => {
        const parts: PersistedChatPart[] = []

        if (msg.content) {
            parts.push({ type: PersistedChatPartType.TEXT, text: msg.content })
        }

        if (msg.thoughts) {
            parts.push({ type: PersistedChatPartType.REASONING, text: msg.thoughts })
        }

        if (msg.toolCalls) {
            for (const tc of msg.toolCalls) {
                parts.push({
                    type: PersistedChatPartType.TOOL_CALL,
                    toolCallId: tc.toolCallId,
                    toolName: tc.title,
                    input: tc.input ?? {},
                    output: tc.output,
                    status: tc.status === 'completed' ? PersistedToolCallStatus.COMPLETED : PersistedToolCallStatus.ERROR,
                })
            }
        }

        return {
            role: msg.role === 'user' ? PersistedChatRole.USER : PersistedChatRole.ASSISTANT,
            parts,
        }
    })
}

// Resolves the exact model id the chat used, verbatim — the Console stores it as-is. The conversation
// only persists the tier id, so we recompute the model the same way the chat does
// (chatHelpers.resolveModelIdForProvider), keyed off the platform's routing provider. For the
// Activepieces/OpenRouter gateways this keeps the full "anthropic/claude-..." slug unchanged.
function resolveModelId({ tierId, provider }: { tierId: string | null, provider: AIProviderName | null }): string | null {
    if (isNil(tierId)) {
        return null
    }
    const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
    if (isNil(tier)) {
        return tierId
    }
    if (isNil(provider)) {
        return tier.modelId
    }
    return chatHelpers.resolveModelIdForProvider({ tier, provider })
}

async function resolveChatProviderName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<AIProviderName | null> {
    const result = await tryCatch(() => aiProviderService(log).getChatProviderName({ platformId }))
    return result.error ? null : result.data
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

type ConversationLookups = {
    userCache: Map<string, string | null>
    platformCache: Map<string, string | null>
    providerCache: Map<string, AIProviderName | null>
}
