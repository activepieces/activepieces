import {
    ACTIVEPIECES_CHAT_TIERS,
    ActivepiecesError,
    AIProviderName,
    apId,
    ChatConversationStatus,
    DEFAULT_CHAT_TIER_ID,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    Project,
    ProjectType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { UserChatMemoryEntity } from './user-chat-memory-entity'

const STREAMING_STALENESS_TIMEOUT_MS = 2 * 60 * 1_000
const MAX_MEMORIES = 50
const MAX_MEMORY_LENGTH = 280

const conversationRepo = repoFactory(ChatConversationEntity)
const userChatMemoryRepo = repoFactory(UserChatMemoryEntity)

async function getUserMemories({ platformId, userId }: { platformId: string, userId: string }): Promise<string[]> {
    const row = await userChatMemoryRepo().findOneBy({ platformId, userId })
    return row?.memories ?? []
}

async function rememberForUser({ platformId, userId, memory }: { platformId: string, userId: string, memory: string }): Promise<void> {
    const entry = memory.slice(0, MAX_MEMORY_LENGTH)
    const row = await userChatMemoryRepo().findOneBy({ platformId, userId })
    const memories = [...(row?.memories ?? []).filter((m) => m !== entry), entry].slice(-MAX_MEMORIES)
    await userChatMemoryRepo().upsert(
        { id: row?.id ?? apId(), platformId, userId, memories },
        ['platformId', 'userId'],
    )
}

async function getConversationOrThrow({ id, platformId, userId }: { id: string, platformId: string, userId: string }) {
    const conversation = await conversationRepo().findOneBy({ id, platformId, userId })
    if (isNil(conversation)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: id, entityType: 'ChatConversation' },
        })
    }
    if (conversation.status === ChatConversationStatus.STREAMING) {
        const msSinceUpdate = Date.now() - new Date(conversation.updated).getTime()
        if (msSinceUpdate > STREAMING_STALENESS_TIMEOUT_MS) {
            await conversationRepo().update(id, { status: ChatConversationStatus.IDLE })
            conversation.status = ChatConversationStatus.IDLE
        }
    }
    return conversation
}

async function getUserProjects({ platformId, userId, log }: { platformId: string, userId: string, log: FastifyBaseLogger }): Promise<Project[]> {
    const users = userService(log)
    const user = await users.getOneOrFail({ id: userId })
    const allProjects = await projectService(log).getAllForUser({
        platformId,
        userId,
        isPrivileged: users.isUserPrivileged(user),
    })
    return allProjects.filter((p) => p.type !== ProjectType.PERSONAL || p.ownerId === userId)
}

async function resolveChatProvider({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<GetProviderConfigResponse> {
    const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
    if (isNil(chatProvider)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: platformId, entityType: 'ChatAiProvider' },
        })
    }
    return chatProvider
}

function resolveTier({ tierId }: { tierId: string | null }) {
    if (tierId) {
        const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
        if (tier) return tier
    }
    const defaultTier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === DEFAULT_CHAT_TIER_ID)
    return defaultTier ?? ACTIVEPIECES_CHAT_TIERS[0]
}

function resolveModelIdForProvider({ tier, provider }: { tier: { modelId: string }, provider: AIProviderName }): string {
    const openrouterModelId = tier.modelId
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return openrouterModelId
    }
    return openrouterModelId.replace(/^[^/]+\//, '').replace(/\./g, '-')
}

export const chatHelpers = {
    getConversationOrThrow,
    getUserProjects,
    resolveChatProvider,
    resolveTier,
    resolveModelIdForProvider,
    conversationRepo,
    getUserMemories,
    rememberForUser,
}
