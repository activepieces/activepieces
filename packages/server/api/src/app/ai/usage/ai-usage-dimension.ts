import { AIProviderName, AiUsageOrigin, isNil } from '@activepieces/core-utils'
import { AI_USAGE_CREDITS_KEY_ID, AI_USAGE_NO_PROJECT_ID, AI_USAGE_UNKNOWN_KEY_PREFIX, AiUsageDimension, AiUsageSource } from '@activepieces/shared'

function providerOf(value: string): AIProviderName | null {
    return PROVIDERS.find((provider) => provider === value) ?? null
}

function keyFilterOf(id: string): DimensionCondition[] | null {
    if (id === AI_USAGE_CREDITS_KEY_ID) {
        return [{ column: 'provider', value: AIProviderName.ACTIVEPIECES }, { column: 'providerConfigId', value: null }]
    }
    if (id.startsWith(AI_USAGE_UNKNOWN_KEY_PREFIX)) {
        const provider = providerOf(id.slice(AI_USAGE_UNKNOWN_KEY_PREFIX.length))
        return isNil(provider) ? null : [{ column: 'provider', value: provider }, { column: 'providerConfigId', value: null }]
    }
    return [{ column: 'providerConfigId', value: id }]
}

function modelFilterOf(id: string): DimensionCondition[] | null {
    const decoded = Buffer.from(id, 'base64url').toString('utf8')
    const separator = decoded.indexOf(MODEL_ID_SEPARATOR)
    if (separator <= 0 || separator === decoded.length - 1) {
        return null
    }
    const provider = providerOf(decoded.slice(0, separator))
    return isNil(provider) ? null : [{ column: 'provider', value: provider }, { column: 'modelId', value: decoded.slice(separator + 1) }]
}

const PROVIDERS = Object.values(AIProviderName)
const MODEL_ID_SEPARATOR = '|'

export const aiUsageDimension = {
    providerOf,
    sourceOf(origin: AiUsageOrigin): AiUsageSource {
        switch (origin) {
            case AiUsageOrigin.FLOW_STEP:
            case AiUsageOrigin.ACTION_RUN:
                return 'flow-steps'
            case AiUsageOrigin.FLOW_AGENT_STEP:
                return 'agent-steps'
            case AiUsageOrigin.AGENT:
            case AiUsageOrigin.AGENT_BUILDER:
                return 'agents'
            case AiUsageOrigin.CHAT:
                return 'chat'
            case AiUsageOrigin.KNOWLEDGE_BASE:
                return 'knowledge-base'
        }
    },
    idOf({ dimension, keys }: { dimension: AiUsageDimension, keys: DimensionKeys }): string | null {
        switch (dimension) {
            case 'project':
                return keys.projectId ?? AI_USAGE_NO_PROJECT_ID
            case 'flow':
                return keys.flowId
            case 'agent':
                return keys.agentId
            case 'user':
                return keys.userId
            case 'key':
                if (!isNil(keys.providerConfigId)) {
                    return keys.providerConfigId
                }
                return keys.provider === AIProviderName.ACTIVEPIECES ? AI_USAGE_CREDITS_KEY_ID : `${AI_USAGE_UNKNOWN_KEY_PREFIX}${keys.provider}`
            case 'model':
                return Buffer.from(`${keys.provider}${MODEL_ID_SEPARATOR}${keys.modelId}`, 'utf8').toString('base64url')
        }
    },
    filterOf({ dimension, id }: { dimension: AiUsageDimension, id: string }): DimensionCondition[] | null {
        switch (dimension) {
            case 'project':
                return [{ column: 'projectId', value: id === AI_USAGE_NO_PROJECT_ID ? null : id }]
            case 'flow':
                return [{ column: 'flowId', value: id }]
            case 'agent':
                return [{ column: 'agentId', value: id }]
            case 'user':
                return [{ column: 'userId', value: id }]
            case 'key':
                return keyFilterOf(id)
            case 'model':
                return modelFilterOf(id)
        }
    },
}

export type DimensionKeys = {
    projectId: string | null
    flowId: string | null
    agentId: string | null
    userId: string | null
    provider: string | null
    providerConfigId: string | null
    modelId: string | null
}

export type DimensionCondition = {
    column: 'projectId' | 'flowId' | 'agentId' | 'userId' | 'provider' | 'providerConfigId' | 'modelId'
    value: string | null
}
