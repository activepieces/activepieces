import {
    AI_USAGE_AGENT_ID_HEADER,
    AI_USAGE_FEATURE_HEADER,
    AI_USAGE_MCP_ID_HEADER,
    AIProvider,
    AIProviderWithoutSensitiveData,
    AIUsageFeature,
    CreateAIProviderRequest,
    createWebSearchTool,
    SUPPORTED_AI_PROVIDERS,
    SupportedAIProvider,
} from '@activepieces/common-ai'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    isNil,
    PlatformId,
    SeekPage,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { openRouter } from './proxy/openrouter/openrouter'
import { generateText, experimental_generateImage as generateImage, stepCountIs } from 'ai'
import { context } from '@opentelemetry/api'
import { LanguageModelV2Source } from '@ai-sdk/provider'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)
const isCloudEdition = system.getEdition() === ApEdition.CLOUD

export const aiProviderService = {
    async listProviders(userPlatformId: PlatformId): Promise<SeekPage<AIProviderWithoutSensitiveData>> {
        const platformId = await this.getAIProviderPlatformId(userPlatformId)

        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const data: AIProviderWithoutSensitiveData[] = [
            {
                id: 'active-pieces',
                provider: 'active-pieces',
                displayName: 'Active Pieces',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId,
                isConfigured: true,
            }
        ]

        for (const supported of SUPPORTED_AI_PROVIDERS) {
            const isConfigured = configuredProviders.find(c => c.provider === supported.provider)

            data.push({
                id: supported.provider,
                provider: supported.provider,
                displayName: supported.displayName,
                created: isConfigured?.created ?? new Date().toISOString(),
                updated: isConfigured?.updated ?? new Date().toISOString(),
                platformId,
                isConfigured: !!isConfigured,
            })
        }

        return { data, next: null, previous: null }
    },

    async listModels(userPlatformId: PlatformId, providerId: string): Promise<SeekPage<ListModelsResponseItem>> {
        if (providerId !== 'active-pieces') {
            const provider = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerId)
            if (isNil(provider)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_PROVIDER_NOT_SUPPORTED,
                    params: { provider: providerId }
                })
            }

            const textModels = provider.languageModels.map<ListModelsResponseItem>(m => ({
                displayName: m.displayName,
                id: m.instance.modelId,
                slug: m.instance.modelId,
                type: 'text'
            }))
            const imageModels = provider.imageModels.map<ListModelsResponseItem>(m => ({
                id: typeof m.instance == 'string' ? m.instance : m.instance.modelId,
                displayName: m.displayName,
                slug: typeof m.instance == 'string' ? m.instance : m.instance.modelId,
                type: 'image'
            }))
            const videoModels = provider.videoModels.map<ListModelsResponseItem>(m => ({
                displayName: m.displayName,
                id: m.instance.modelId,
                slug: m.instance.modelId,
                type: 'video'
            }))

            return { data: [...textModels, ...imageModels, ...videoModels], next: null, previous: null }
        } else {
            const client = await openRouter.getPlatformClient(userPlatformId)
            const { data: models } = await client.models.list()

            const data: ListModelsResponseItem[] = models.map(model => ({
                displayName: model.name,
                id: model.id,
                slug: model.canonicalSlug,
                type: model.architecture.outputModalities.includes('text') ? 'text' : 'image'
            }))

            return { data, next: null, previous: null }
        }
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        assertOnlyCloudPlatformCanEditOnCloud(platformId)

        if (request.useAzureOpenAI && system.getEdition() !== ApEdition.ENTERPRISE) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Azure OpenAI is only available for enterprise customers',
                },
            })
        }

        await aiProviderRepo().upsert({
            id: apId(),
            config: await encryptUtils.encryptObject({
                apiKey: request.apiKey,
                azureOpenAI: request.useAzureOpenAI ? {
                    resourceName: request.resourceName,
                } : undefined,
            }),
            provider: request.provider,
            platformId,
        }, ['provider', 'platformId'])
    },

    async delete(platformId: PlatformId, provider: string): Promise<void> {
        assertOnlyCloudPlatformCanEditOnCloud(platformId)

        await aiProviderRepo().delete({
            platformId,
            provider,
        })
    },

    async getConfig(provider: string, platformId: PlatformId): Promise<AIProvider['config']> {
        const aiProvider = await aiProviderRepo().findOneOrFail({
            where: {
                provider,
                platformId,
            },
            select: {
                config: {
                    iv: true,
                    data: true,
                },
            },
        })

        return encryptUtils.decryptObject(aiProvider.config)
    },

    async runTextModel(platformId: PlatformId, providerId: string, model: string, params: RunTextModelParams): Promise<RunTextModelResponse> {
        if (providerId === 'active-pieces') {
            const client = await openRouter.getPlatformClient(platformId)
            
            const { usage, choices: [{ message }] } = await client.chat.send({
                model,
                messages: [
                    ...(params.conversation ?? []),
                    {
                        role: 'user',
                        content: params.prompt,
                    }
                ],
                maxTokens: params.maxOutputTokens,
            })

            // TODO: charge ai credit

            if (isNil(message.content)) {
                throw new ActivepiecesError({ 
                    code: ErrorCode.NO_CHAT_RESPONSE,
                    params: {}
                })
            }
            

            if (typeof message.content === 'string') {
                return { sources: [], text: message.content };
            }

            const text = message.content.filter(c => c.type === 'text')[0];
            if (isNil(text)) {
                throw new ActivepiecesError({ 
                    code: ErrorCode.NO_CHAT_RESPONSE,
                    params: {}
                })
            }

            return { sources: [], text: text.text }
        } else {
            const config = await this.getConfig(providerId, platformId)
            const provider = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerId)
            if (isNil(provider)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_PROVIDER_NOT_SUPPORTED,
                    params: { provider: providerId }
                })
            }

            const headers = {
                [provider.auth.headerName]: provider.auth.bearer ? `Bearer ${config.apiKey}` : config.apiKey,
            }

            const languageModel = provider.languageModels.find(m => m.instance.modelId === model)
            if (isNil(languageModel)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                    params: { model, provider: providerId }
                })
            }

            const response = await generateText({
                model: languageModel.instance,
                messages: [
                    ...(params.conversation ?? []),
                    {
                        role: 'user',
                        content: params.prompt,
                    },
                ],
                maxOutputTokens: params.maxOutputTokens,
                temperature: (params.creativity ?? 100) / 100,
                tools: params.webSearch?.enabled ? createWebSearchTool(providerId, params.webSearch) : undefined,
                stopWhen: stepCountIs(params.webSearch?.maxUses ?? 5),
                headers,
            })

            return { sources: params.webSearch?.includeSources ? response.sources : [], text: response.text }
        }
    },

    async runImageModel(platformId: PlatformId, providerId: string, model: string, params: RunImageModelParams): Promise<RunImageModelResponse> {
        if (providerId === 'active-pieces') {
            const client = await openRouter.getPlatformClient(platformId)
            
            const { usage, choices: [{ message }] } = await client.chat.send({
                model,
                messages: [
                    {
                        role: 'user', 
                        content: [
                            ...(params.inputImages?.map(i => ({ type: 'file', file: {fileData: i }} as const)) ?? []),
                            { type: 'text', text: params.prompt },
                        ] 
                    }
                ],
                stream: false,
            })

            // TODO: charge ai credit

            if (isNil(message.content)) {
                throw new ActivepiecesError({ 
                    code: ErrorCode.NO_CHAT_RESPONSE,
                    params: {}
                })
            }
            if (typeof message.content === 'string') {
                throw new ActivepiecesError({ 
                    code: ErrorCode.NO_CHAT_RESPONSE,
                    params: {}
                })
            }

            const image = message.content.filter(c => c.type === 'image_url')[0];
            if (isNil(image)) {
                throw new ActivepiecesError({ 
                    code: ErrorCode.NO_CHAT_RESPONSE,
                    params: {}
                })
            }

            return { url: image.imageUrl.url }
        } else {
            const config = await this.getConfig(providerId, platformId)
            const provider = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerId)
            if (isNil(provider)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_PROVIDER_NOT_SUPPORTED,
                    params: { provider: providerId }
                })
            }

            const headers = {
                [provider.auth.headerName]: provider.auth.bearer ? `Bearer ${config.apiKey}` : config.apiKey,
            }

            const imageModel = provider.imageModels.find(m => {
                const modelId = typeof m.instance === 'string' ? m.instance : m.instance.modelId;
                return modelId === model
            })
            if (isNil(imageModel)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                    params: { model, provider: providerId }
                })
            }

            const response = await generateImage({
                model: imageModel.instance,
                prompt: params.prompt,
                size: params.size,
                headers,
            })

            return response.image
        }
    },

    async getAIProviderPlatformId(userPlatformId: string): Promise<string> {
        if (!isCloudEdition) return userPlatformId

        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        if (cloudPlatformId === userPlatformId) return cloudPlatformId

        const platform = await platformService.getOneWithPlanOrThrow(userPlatformId)
        const isEnterpriseCustomer = platformUtils.isCustomerOnDedicatedDomain(platform)
        return isEnterpriseCustomer ? userPlatformId : cloudPlatformId
    },
}

type RunTextModelParams = {
    prompt: string;
    conversation?: { 
        role: 'user';
        content: string;
    }[];
    maxOutputTokens?: number;
    creativity?: number;
    webSearch?: {
        enabled: boolean;
        maxUses?: number;
        includeSources?: boolean;
    };
}
type RunTextModelResponse = {
    text: string;
    sources: LanguageModelV2Source[];
}

type RunImageModelParams = {
    prompt: string;
    inputImages?: string[];
    quality?: 'high' | 'low' | 'medium';
    size?: `${number}x${number}`;
}
type RunImageModelResponse = {
    url?: string;
    base64?: string;
    uint8Array?: Uint8Array;
    mediaType?: string;
}

type ListModelsResponseItem = {
    id: string;
    slug: string;
    displayName: string;
    type: 'text' | 'video' | 'image';
}

function assertOnlyCloudPlatformCanEditOnCloud(platformId: PlatformId): void {
    if (!isCloudEdition) {
        return
    }
    const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
    if (platformId === cloudPlatformId) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: {
            message: 'invalid route for principal type',
        },
    })
}

