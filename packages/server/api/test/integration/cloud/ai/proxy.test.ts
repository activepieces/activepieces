import { CategorizedLanguageModelPricing, DALLE3PricingPerImage, FlatLanguageModelPricing, GPTImage1PricingPerImage, TieredLanguageModelPricing } from '@activepieces/common-ai'
import { ErrorCode, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { AIUsageEntity, AIUsageSchema } from '../../../../src/app/ai/ai-usage-entity'
import { calculateTokensCost, getProviderConfig } from '../../../../src/app/ai/providers'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    CLOUD_PLATFORM_ID,
    mockAndSaveAIProvider,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

const openaiKey = process.env.OPENAI_API_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const replicateKey = process.env.REPLICATE_API_TOKEN

describe('AI Providers Proxy', () => {
    it('prevent empty test suite', async () => {
        // Prevent empty test suite
    })
    if (openaiKey) {
        describe('OpenAI', () => {
            it('should record the usage cost of a chat completion request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'openai',
                    config: {
                        apiKey: openaiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('openai')?.languageModels.find(model => model.instance.modelId === 'gpt-4.1-nano')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/openai/v1/chat/completions',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        model: model?.instance.modelId,
                        messages: [
                            {
                                role: 'user',
                                content: 'Hello, how are you?',
                            },
                        ],
                    },
                })
                const data = response?.json()
                const { usage } = data as { usage: { prompt_tokens: number, completion_tokens: number } }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const totalCost = calculateTokensCost(usage.prompt_tokens, inputCost) + calculateTokensCost(usage.completion_tokens, outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'openai')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a streaming chat completion request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    plan: {
                        includedAiCredits: 10,
                    },
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'openai',
                    config: {
                        apiKey: openaiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('openai')?.languageModels.find(model => model.instance.modelId === 'gpt-4.1-nano')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/openai/v1/chat/completions',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        model: model?.instance.modelId,
                        messages: [
                            {
                                role: 'user',
                                content: 'Hello, how are you?',
                            },
                        ],
                        stream: true,
                    },
                })
                
                // Parse the SSE stream response
                const streamData = response?.body as string
                const streamingParser = aiProviderService.streamingParser('openai')
                
                // Process the stream chunks
                streamingParser.onChunk(streamData)
                const parsedResponse = streamingParser.onEnd()
                
                const { usage } = parsedResponse as { usage: { prompt_tokens: number, completion_tokens: number } }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const totalCost = calculateTokensCost(usage.prompt_tokens, inputCost) + calculateTokensCost(usage.completion_tokens, outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'openai')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a responses request with web search', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'openai',
                    config: {
                        apiKey: openaiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('openai')?.languageModels.find(model => model.instance.modelId === 'gpt-4.1-mini')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/openai/v1/responses',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        model: model?.instance.modelId,
                        input: 'Give me a title of hackernews article',
                        tools: [{
                            type: 'web_search_preview',
                        }],
                        max_tool_calls: 1,
                    },
                })
                const data = response?.json()
                const { usage } = data as { usage: { input_tokens: number, output_tokens: number } }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const webSearchCost = model?.webSearchCost ?? 0
                const totalCost = calculateTokensCost(usage.input_tokens, inputCost) + calculateTokensCost(usage.output_tokens, outputCost) + webSearchCost

                const aiUsage = await pollForAIUsage(mockProject.id, 'openai')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a DALL-E 3 image generation request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'openai',
                    config: {
                        apiKey: openaiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('openai')?.imageModels.find(model => model.instance.modelId === 'dall-e-3')
                const size = '1024x1024'
                const quality = 'standard'
                const imageCount = 1

                // act
                await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/openai/v1/images/generations',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        model: model?.instance.modelId,
                        prompt: 'A beautiful sunset over mountains',
                        size,
                        quality,
                    },
                })

                // assert
                const pricing = model?.pricing as DALLE3PricingPerImage
                const imageCost = pricing[quality][size as keyof typeof pricing[typeof quality]]
                const totalCost = imageCost * imageCount

                const aiUsage = await pollForAIUsage(mockProject.id, 'openai')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a GPT-Image-1 image generation request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'openai',
                    config: {
                        apiKey: openaiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('openai')?.imageModels.find(model => model.instance.modelId === 'gpt-image-1')
                const size = '1024x1024'
                const quality = 'low'

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/openai/v1/images/generations',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        model: model?.instance.modelId,
                        prompt: 'A beautiful sunset over mountains',
                        size,
                        quality,
                    },
                })

                // assert
                const pricing = model?.pricing as GPTImage1PricingPerImage
                const imageCost = pricing.input.image
                const textCost = pricing.input.text
                const outputCost = pricing.output
                const { usage } = response?.json() as { usage: { input_tokens_details: { image_tokens: number, text_tokens: number }, output_tokens: number } }
                const totalCost = calculateTokensCost(usage.input_tokens_details.image_tokens, imageCost) + calculateTokensCost(usage.input_tokens_details.text_tokens, textCost) + calculateTokensCost(usage.output_tokens, outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'openai')
                expect(aiUsage?.cost).toBe(totalCost)
            })
        })
    }

    if (anthropicKey) {
        describe('Anthropic', () => {
            it('should record the usage cost of a messages request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'anthropic',
                    config: {
                        apiKey: anthropicKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('anthropic')?.languageModels.find(model => model.instance.modelId === 'claude-3-5-haiku-20241022')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/anthropic/v1/messages',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                        'anthropic-version': '2023-06-01',
                    },
                    body: {
                        model: model?.instance.modelId,
                        messages: [
                            {
                                role: 'user',
                                content: 'Give me a title of hackernews article',
                            },
                        ],
                        max_tokens: 2000,
                    },
                })
                const data = response?.json()
                const { usage } = data as { usage: { input_tokens: number, output_tokens: number } }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const totalCost = calculateTokensCost(usage.input_tokens, inputCost) + calculateTokensCost(usage.output_tokens, outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'anthropic')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a messages request with web search', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'anthropic',
                    config: {
                        apiKey: anthropicKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('anthropic')?.languageModels.find(model => model.instance.modelId === 'claude-3-5-haiku-20241022')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/anthropic/v1/messages',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                        'anthropic-version': '2023-06-01',
                    },
                    body: {
                        model: model?.instance.modelId,
                        messages: [
                            {
                                role: 'user',
                                content: 'Give me a title of hackernews article',
                            },
                        ],
                        max_tokens: 2000,
                        tools: [{
                            type: 'web_search_20250305',
                            name: 'web_search',
                            max_uses: 1,
                        }],
                    },
                })
                const data = response?.json()
                const { usage } = data as { usage: { input_tokens: number, output_tokens: number } }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const webSearchCost = model?.webSearchCost ?? 0
                const totalCost = calculateTokensCost(usage.input_tokens, inputCost) + calculateTokensCost(usage.output_tokens, outputCost) + webSearchCost

                const aiUsage = await pollForAIUsage(mockProject.id, 'anthropic')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should fail when attempting a streaming request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'anthropic',
                    config: {
                        apiKey: anthropicKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('anthropic')?.languageModels.find(model => model.instance.modelId === 'claude-3-5-haiku-20241022')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/anthropic/v1/messages',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                        'anthropic-version': '2023-06-01',
                    },
                    body: {
                        model: model?.instance.modelId,
                        messages: [
                            {
                                role: 'user',
                                content: 'Hello, how are you?',
                            },
                        ],
                        max_tokens: 100,
                        stream: true,
                    },
                })
                const errorData = response?.json() as { code: string, params: { message: string } }

                // assert
                expect(response?.statusCode).toBe(400)
                expect(errorData.code).toBe(ErrorCode.AI_REQUEST_NOT_SUPPORTED)
            })
        })
    }

    if (geminiKey) {
        describe('Google Gemini', () => {
            it('should record the usage cost of a tiered pricing model (Gemini 2.5 Pro)', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'google',
                    config: {
                        apiKey: geminiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('google')?.languageModels.find(model => model.instance.modelId === 'gemini-2.5-pro')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: `/v1/ai-providers/proxy/google/v1beta/models/${model?.instance.modelId}:generateContent`,
                    headers: {
                        'x-goog-api-key': geminiKey,
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: 'Hello, how are you?',
                                    },
                                ],
                            },
                        ],
                    },
                })
                const data = response?.json()
                const { usageMetadata } = data as { 
                    usageMetadata: { 
                        promptTokenCount: number
                        candidatesTokenCount: number
                        thoughtsTokenCount?: number
                    } 
                }

                // assert
                const { input: inputPricing, output: outputPricing, promptThreshold } = model?.pricing as TieredLanguageModelPricing
                const isUnderThreshold = usageMetadata.promptTokenCount <= promptThreshold
                const inputCost = isUnderThreshold ? inputPricing.underThresholdRate : inputPricing.overThresholdRate
                const outputCost = isUnderThreshold ? outputPricing.underThresholdRate : outputPricing.overThresholdRate

                const totalCost = calculateTokensCost(usageMetadata.promptTokenCount, inputCost) + 
                    calculateTokensCost(usageMetadata.candidatesTokenCount + (usageMetadata.thoughtsTokenCount ?? 0), outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'google')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a categorized pricing model (Gemini 2.5 Flash) with text input and web search', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'google',
                    config: {
                        apiKey: geminiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('google')?.languageModels.find(model => model.instance.modelId === 'gemini-2.5-flash')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: `/v1/ai-providers/proxy/google/v1beta/models/${model?.instance.modelId}:generateContent`,
                    headers: {
                        'x-goog-api-key': geminiKey,
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: 'Give me a title of hackernews article. Use the web search tool only a SINGLE time.',
                                    },
                                ],
                            },
                        ],
                        tools: [{
                            google_search: {},
                        }],
                    },
                })
                const data = response?.json()
                const { usageMetadata } = data as { 
                    usageMetadata: { 
                        promptTokenCount: number
                        candidatesTokenCount: number
                        thoughtsTokenCount?: number
                        promptTokensDetails: {
                            modality: 'TEXT'
                            tokenCount: number
                        }[]
                    } 
                }

                // assert
                const { input: inputPricing, output: outputCost } = model?.pricing as CategorizedLanguageModelPricing
                const webSearchCost = model?.webSearchCost ?? 0
                const totalCost = calculateTokensCost(usageMetadata.candidatesTokenCount + (usageMetadata.thoughtsTokenCount ?? 0), outputCost) +
                    calculateTokensCost(usageMetadata.promptTokenCount, inputPricing.default) + webSearchCost

                const aiUsage = await pollForAIUsage(mockProject.id, 'google')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a flat pricing model (Gemini 2.0 Flash-Lite)', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'google',
                    config: {
                        apiKey: geminiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('google')?.languageModels.find(model => model.instance.modelId === 'gemini-2.0-flash-lite')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/google/v1beta/models/gemini-2.0-flash-lite:generateContent',
                    headers: {
                        'x-goog-api-key': geminiKey,
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: 'Hello, how are you?',
                                    },
                                ],
                            },
                        ],
                    },
                })
                const data = response?.json()
                const { usageMetadata } = data as { 
                    usageMetadata: { 
                        promptTokenCount: number
                        candidatesTokenCount: number
                        thoughtsTokenCount?: number
                    } 
                }

                // assert
                const { input: inputCost, output: outputCost } = model?.pricing as FlatLanguageModelPricing
                const totalCost = calculateTokensCost(usageMetadata.promptTokenCount, inputCost) + 
                    calculateTokensCost(usageMetadata.candidatesTokenCount + (usageMetadata.thoughtsTokenCount ?? 0), outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'google')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should fail when attempting a streaming request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'google',
                    config: {
                        apiKey: geminiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('google')?.languageModels.find(model => model.instance.modelId === 'gemini-2.5-flash')

                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: `/v1/ai-providers/proxy/google/v1beta/models/${model?.instance.modelId}:streamGenerateContent`,
                    headers: {
                        'x-goog-api-key': geminiKey,
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: 'Hello, how are you?',
                                    },
                                ],
                            },
                        ],
                    },
                })
                const errorData = response?.json() as { code: string, params: { message: string } }

                // assert
                expect(response?.statusCode).toBe(400)
                expect(errorData.code).toBe(ErrorCode.AI_REQUEST_NOT_SUPPORTED)
            })
            it('should record the usage cost of an image model (Gemini 2.5 Flash Image Preview)', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'google',
                    config: {
                        apiKey: geminiKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('google')?.imageModels.find(model => model.instance.modelId === 'gemini-2.5-flash-image-preview')
                if (isNil(model)) {
                    throw new Error('Google Gemini 2.5 Flash Image Preview model not found')
                }
                if (typeof model.pricing !== 'object' || model.pricing.type !== 'GPTImage1') {
                    throw new Error('Google Gemini 2.5 Flash Image Preview model pricing type is not GPTImage1')
                }
                // act
                const response = await app?.inject({
                    method: 'POST',
                    url: `/v1/ai-providers/proxy/google/v1beta/models/${model?.instance.modelId}:generateContent`,
                    headers: {
                        'x-goog-api-key': geminiKey,
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    {
                                        text: 'generate an image of a cat',
                                    },
                                ],
                            },
                        ],
                    },
                })
                const data = response?.json()
                const { usageMetadata } = data as { 
                    usageMetadata: { 
                        promptTokenCount: number
                        candidatesTokenCount: number
                        thoughtsTokenCount?: number
                    } 
                }

                // assert
                const { input: inputCost, output: outputCost } = model.pricing 
                const totalCost = calculateTokensCost(usageMetadata.promptTokenCount, inputCost.image) + 
                  calculateTokensCost(usageMetadata.candidatesTokenCount + (usageMetadata.thoughtsTokenCount ?? 0), outputCost)

                const aiUsage = await pollForAIUsage(mockProject.id, 'google')
                expect(aiUsage?.cost).toBe(totalCost)
            })
        })
    }

    if (replicateKey) {
        describe('Replicate', () => {
            it('should record the usage cost of an image generation request of versioned model', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'replicate',
                    config: {
                        apiKey: replicateKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('replicate')?.imageModels.find(model => model.instance.modelId === 'bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637')
                const imageCount = 1

                // act
                await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/replicate/v1/predictions',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        input: {
                            prompt: 'A beautiful sunset over mountains',
                            num_outputs: imageCount,
                        },
                        version: model?.instance.modelId.split(':')[1],
                    },
                })

                // assert
                const totalCost = (model?.pricing as number) * imageCount

                const aiUsage = await pollForAIUsage(mockProject.id, 'replicate')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of an image generation request of unversioned model', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'replicate',
                    config: {
                        apiKey: replicateKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('replicate')?.imageModels.find(model => model.instance.modelId === 'black-forest-labs/flux-schnell')
                const imageCount = 1

                // act
                await app?.inject({
                    method: 'POST',
                    url: `/v1/ai-providers/proxy/replicate/v1/models/${model?.instance.modelId}/predictions`,
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        input: {
                            prompt: 'A beautiful sunset over mountains',
                            num_outputs: imageCount,
                        },
                    },
                })

                // assert
                const totalCost = (model?.pricing as number) * imageCount

                const aiUsage = await pollForAIUsage(mockProject.id, 'replicate')
                expect(aiUsage?.cost).toBe(totalCost)
            })

            it('should record the usage cost of a multiple image generation request', async () => {
                // arrange
                const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                    platform: {
                        id: CLOUD_PLATFORM_ID,
                    },
                    plan: {
                        includedAiCredits: 10,
                    },
                })
                await mockAndSaveAIProvider({
                    platformId: mockPlatform.id,
                    provider: 'replicate',
                    config: {
                        apiKey: replicateKey,
                    },
                })

                const mockToken = await generateMockToken({
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    id: mockOwner.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                const model = getProviderConfig('replicate')?.imageModels.find(model => model.instance.modelId === 'black-forest-labs/flux-schnell')
                const imageCount = 3

                // act
                await app?.inject({
                    method: 'POST',
                    url: '/v1/ai-providers/proxy/replicate/v1/models/black-forest-labs/flux-schnell/predictions',
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                    body: {
                        input: {
                            prompt: 'A futuristic cityscape at night',
                            num_outputs: imageCount,
                        },
                    },
                })

                // assert
                const totalCost = (model?.pricing as number) * imageCount

                const aiUsage = await pollForAIUsage(mockProject.id, 'replicate')
                expect(aiUsage?.cost).toBe(totalCost)
            })
        })
    }


})


/**
 * Polls for AI usage data because response is returned before Ai usage is recorded
 */
async function pollForAIUsage(projectId: string, provider: string, maxAttempts = 5): Promise<AIUsageSchema | null> {
    let tries = 0
    let aiUsage: AIUsageSchema | null = null
    
    while (tries < maxAttempts) {
        aiUsage = await databaseConnection().getRepository(AIUsageEntity).findOne({
            where: {
                projectId,
                provider,
            },
            order: {
                created: 'DESC',
            },
        })
        
        if (aiUsage) {
            break
        }
        
        tries++
        // Add a small delay between attempts to wait for the AI usage to be recorded
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return aiUsage
}
