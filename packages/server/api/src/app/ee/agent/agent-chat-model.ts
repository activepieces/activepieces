import { ActivepiecesError, AIProviderName, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { AgentConversation, AI_PROVIDER_ENTITY_TYPES, GetProviderConfigResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { ProviderScope } from '../../ai/ai-key-scope'
import { aiModelOptionsService } from '../../ai/ai-model-options-service'
import { aiProviderService } from '../../ai/ai-provider-service'
import { platformModelTierService } from '../../ai/platform-model-tier-service'
import { agentHelpers } from './agent-helpers'
import { agentModelResolution } from './agent-model-resolution'
import { agentModelTier } from './agent-model-tier'

export const agentChatModel = (log: FastifyBaseLogger) => ({
    async defaultPick({ platformId, projectId }: { platformId: string, projectId: string }): Promise<ChatPick | null> {
        const scope: ProviderScope = { type: 'project', projectId }
        const defaultTier = await platformModelTierService.getDefaultForRun({ platformId, scope })
        if (!isNil(defaultTier)) {
            const { error } = await tryCatch(() => agentModelTier(log).assertUsable({ platformId, tierId: defaultTier.tier.id, scope }))
            if (isNil(error)) {
                return { modelTierId: defaultTier.tier.id, providerConfigId: null, modelName: null }
            }
        }
        const chatKey = await aiProviderService(log).getChatKey({ platformId, scope })
        const { defaultChoice } = await aiModelOptionsService(log).list({ platformId, projectId, surface: 'chat' })
        const onChatKey = defaultChoice?.type === 'model' && defaultChoice.providerConfigId === chatKey?.id
        if (!isNil(chatKey) && !onChatKey) {
            return null
        }
        if (isNil(defaultChoice)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: platformId, entityType: AI_PROVIDER_ENTITY_TYPES.chatProvider },
            }, 'no AI model is available to this project')
        }
        return defaultChoice.type === 'tier'
            ? { modelTierId: defaultChoice.tierId, providerConfigId: null, modelName: null }
            : { modelTierId: null, providerConfigId: defaultChoice.providerConfigId, modelName: defaultChoice.modelId }
    },

    async needsDefaultPick({ platformId, conversation, scope }: { platformId: string, conversation: ChatPick, scope: ProviderScope }): Promise<boolean> {
        if (!isNil(conversation.modelTierId) || !isNil(conversation.providerConfigId)) {
            return false
        }
        return isNil(conversation.modelName) || isNil(await aiProviderService(log).getChatKey({ platformId, scope }))
    },

    async pinnedConfig({ platformId, configId, modelName, scope }: { platformId: string, configId: string, modelName: string | null, scope: ProviderScope }): Promise<PinnedConfig> {
        const config = await aiProviderService(log).findKeyConfig({ platformId, configId, scope })
        const modelId = isNil(config) || isNil(modelName)
            ? null
            : agentModelResolution.resolvePinnedModelId({ provider: config.provider, modelName, config: config.config, modelScope: config.modelScope, modelIds: config.modelIds, log })
        if (isNil(config) || isNil(modelId)) {
            throw unavailableError()
        }
        return { config, modelId }
    },

    async assertOffered({ platformId, projectId, providerConfigId, modelName }: { platformId: string, projectId: string, providerConfigId: string, modelName: string }): Promise<void> {
        const options = await aiModelOptionsService(log).list({ platformId, projectId, surface: 'chat' })
        const onKey = options.keys.some((key) => key.providerConfigId === providerConfigId && key.models.some((model) => model.id === modelName))
        const onCredits = options.credits?.providerConfigId === providerConfigId && options.credits.tiers.some((tier) => tier.id === modelName)
        if (!onKey && !onCredits) {
            throw unavailableError()
        }
    },

    async assertRunnable({ platformId, conversation, scope }: { platformId: string, conversation: ChatPick, scope: Extract<ProviderScope, { type: 'project' }> }): Promise<void> {
        if (!isNil(conversation.modelTierId)) {
            await agentModelTier(log).assertUsable({ platformId, tierId: conversation.modelTierId, scope })
            return
        }
        if (!isNil(conversation.providerConfigId)) {
            await this.pinnedConfig({ platformId, configId: conversation.providerConfigId, modelName: conversation.modelName ?? null, scope })
            return
        }
        if (await this.needsDefaultPick({ platformId, conversation, scope }) && !isNil(await this.defaultPick({ platformId, projectId: scope.projectId }))) {
            return
        }
        await agentHelpers.assertRunProviderConfigured({ platformId, scope, log })
    },

    legacyPin({ config, selectedModel, runTierId, resolvedModelId }: { config: GetProviderConfigResponse, selectedModel: string | null, runTierId: string, resolvedModelId: string }): ChatPick {
        const followsManagedTier = (config.provider === AIProviderName.ACTIVEPIECES || config.provider === AIProviderName.OPENROUTER)
            && (isNil(selectedModel) || agentModelResolution.isTierId({ modelName: selectedModel }))
        return { modelTierId: null, providerConfigId: config.configId, modelName: followsManagedTier ? selectedModel ?? runTierId : resolvedModelId }
    },

    async persistPick({ conversationId, loadedModelName, pick }: { conversationId: string, loadedModelName: string | null, pick: ChatPick }): Promise<void> {
        await agentHelpers.conversationRepo().update(
            { id: conversationId, providerConfigId: IsNull(), modelTierId: IsNull(), modelName: isNil(loadedModelName) ? IsNull() : loadedModelName },
            pick,
        )
    },
})

function unavailableError(): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: CHAT_MODEL_UNAVAILABLE_MESSAGE } })
}

const CHAT_MODEL_UNAVAILABLE_MESSAGE = 'The model this chat uses isn\'t available anymore. Pick another model.'

export type ChatPick = Pick<AgentConversation, 'modelTierId' | 'providerConfigId' | 'modelName'>

type PinnedConfig = {
    config: GetProviderConfigResponse
    modelId: string
}
