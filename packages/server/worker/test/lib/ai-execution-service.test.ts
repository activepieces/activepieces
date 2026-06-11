import { AIProviderName, AiUsageModality, ExecuteAiMode, WorkerToApiContract } from '@activepieces/shared'
import { MockImageModelV3, MockLanguageModelV3 } from 'ai/test'
import { Logger } from 'pino'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createChatModelMock, createImageModelMock } = vi.hoisted(() => ({
    createChatModelMock: vi.fn(),
    createImageModelMock: vi.fn(),
}))

vi.mock('@activepieces/server-utils', () => ({
    chatAiUtils: { createChatModel: createChatModelMock },
    aiModelUtils: { createImageModel: createImageModelMock },
}))

const { aiExecutionService } = await import('../../src/lib/ai/ai-execution-service')

function makeLogger(): Logger {
    return { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as Logger
}

function makeApiClient(overrides: Partial<WorkerToApiContract>): WorkerToApiContract {
    return {
        resolveAiProvider: vi.fn().mockResolvedValue({ provider: AIProviderName.OPENAI, auth: { apiKey: 'sk-test' }, config: {}, platformId: 'platform-1' }),
        reportAiUsage: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    } as unknown as WorkerToApiContract
}

function textModelReturning(text: string): MockLanguageModelV3 {
    return new MockLanguageModelV3({
        doGenerate: async () => ({
            content: [{ type: 'text', text }],
            finishReason: 'stop',
            usage: {
                inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
                outputTokens: { total: 8, text: 8, reasoning: undefined },
            },
            warnings: [],
        }),
    })
}

describe('aiExecutionService.executeAi', () => {
    beforeEach(() => {
        createChatModelMock.mockReset()
        createImageModelMock.mockReset()
    })

    it('resolves provider with the engine token and runs text generation', async () => {
        createChatModelMock.mockReturnValue(textModelReturning('the answer'))
        const apiClient = makeApiClient({})
        const service = aiExecutionService({ log: makeLogger(), apiClient })

        const response = await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'engine-token-xyz',
            prompt: 'what is 2+2?',
        })

        expect(apiClient.resolveAiProvider).toHaveBeenCalledWith({ engineToken: 'engine-token-xyz', provider: AIProviderName.OPENAI })
        expect(response.text).toBe('the answer')
        expect(response.usage).toEqual({ inputTokens: 12, outputTokens: 8, totalTokens: 20 })
    })

    it('emits exactly one TEXT usage event per text call', async () => {
        createChatModelMock.mockReturnValue(textModelReturning('ok'))
        const reportAiUsage = vi.fn().mockResolvedValue(undefined)
        const apiClient = makeApiClient({ reportAiUsage })
        const service = aiExecutionService({ log: makeLogger(), apiClient })

        await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'tok',
            prompt: 'hi',
            stepName: 'step_1',
            actionName: 'askAi',
        })
        await flushMicrotasks()

        expect(reportAiUsage).toHaveBeenCalledTimes(1)
        const reported = reportAiUsage.mock.calls[0][0]
        expect(reported.engineToken).toBe('tok')
        expect(reported.event.modality).toBe(AiUsageModality.TEXT)
        expect(reported.event.context).toMatchObject({ stepName: 'step_1', actionName: 'askAi' })
    })

    it('runs image generation and returns base64 images', async () => {
        createImageModelMock.mockReturnValue(new MockImageModelV3({
            doGenerate: async () => ({
                images: ['aGVsbG8='],
                warnings: [],
                response: { timestamp: new Date(0), modelId: 'gpt-image-1', headers: undefined },
            }),
        }))
        const reportAiUsage = vi.fn().mockResolvedValue(undefined)
        const apiClient = makeApiClient({ reportAiUsage })
        const service = aiExecutionService({ log: makeLogger(), apiClient })

        const response = await service.executeAi({
            mode: ExecuteAiMode.IMAGE,
            provider: AIProviderName.OPENAI,
            model: 'gpt-image-1',
            engineToken: 'tok',
            prompt: 'a cat',
        })
        await flushMicrotasks()

        expect(response.images).toHaveLength(1)
        expect(response.images?.[0].base64).toBe('aGVsbG8=')
        expect(reportAiUsage.mock.calls[0][0].event.modality).toBe(AiUsageModality.IMAGE)
        expect(reportAiUsage.mock.calls[0][0].event.imageCount).toBe(1)
    })

    it('derives the OpenAI responses model and returns sources when web search is enabled', async () => {
        createChatModelMock.mockReturnValue(new MockLanguageModelV3({
            doGenerate: async () => ({
                content: [
                    { type: 'source', sourceType: 'url', id: 'src-1', url: 'https://example.com', title: 'Example' },
                    { type: 'text', text: 'searched answer' },
                ],
                finishReason: 'stop',
                usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 3, text: 3, reasoning: undefined },
                },
                warnings: [],
            }),
        }))
        const service = aiExecutionService({ log: makeLogger(), apiClient: makeApiClient({}) })

        const response = await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'tok',
            prompt: 'find it on the web',
            webSearchEnabled: true,
        })

        expect(createChatModelMock).toHaveBeenCalledWith(expect.objectContaining({ openaiResponsesModel: true }))
        expect(response.text).toBe('searched answer')
        expect(response.sources).toHaveLength(1)
    })

    it('builds the plain chat model and omits sources when web search is disabled', async () => {
        createChatModelMock.mockReturnValue(textModelReturning('plain answer'))
        const service = aiExecutionService({ log: makeLogger(), apiClient: makeApiClient({}) })

        const response = await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'tok',
            prompt: 'hi',
        })

        expect(createChatModelMock).toHaveBeenCalledWith(expect.objectContaining({ openaiResponsesModel: false }))
        expect(response.sources).toBeUndefined()
    })

    it('maps text-mode generated files to images (providers that emit images over the text API)', async () => {
        createChatModelMock.mockReturnValue(new MockLanguageModelV3({
            doGenerate: async () => ({
                content: [{ type: 'file', data: 'aW1hZ2U=', mediaType: 'image/png' }],
                finishReason: 'stop',
                usage: {
                    inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
                    outputTokens: { total: 3, text: 3, reasoning: undefined },
                },
                warnings: [],
            }),
        }))
        const service = aiExecutionService({ log: makeLogger(), apiClient: makeApiClient({}) })

        const response = await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.GOOGLE,
            model: 'gemini-2.5-flash-image',
            engineToken: 'tok',
            messages: [{ role: 'user', content: [{ type: 'text', text: 'a cat' }] }],
        })

        expect(response.images).toHaveLength(1)
        expect(response.images?.[0]).toEqual({ base64: 'aW1hZ2U=', mediaType: 'image/png' })
    })

    it('passes input images through to image generation for editing', async () => {
        const doGenerate = vi.fn().mockResolvedValue({
            images: ['ZWRpdGVk'],
            warnings: [],
            response: { timestamp: new Date(0), modelId: 'gpt-image-1', headers: undefined },
        })
        createImageModelMock.mockReturnValue(new MockImageModelV3({ doGenerate }))
        const service = aiExecutionService({ log: makeLogger(), apiClient: makeApiClient({}) })

        const response = await service.executeAi({
            mode: ExecuteAiMode.IMAGE,
            provider: AIProviderName.OPENAI,
            model: 'gpt-image-1',
            engineToken: 'tok',
            prompt: 'make it blue',
            inputImages: ['c291cmNl'],
        })

        expect(response.images?.[0].base64).toBe('ZWRpdGVk')
        expect(doGenerate).toHaveBeenCalledTimes(1)
    })

    it('propagates provider-resolution failures to the caller', async () => {
        const apiClient = makeApiClient({ resolveAiProvider: vi.fn().mockRejectedValue(new Error('provider not configured')) })
        const service = aiExecutionService({ log: makeLogger(), apiClient })

        await expect(service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'tok',
            prompt: 'hi',
        })).rejects.toThrow('provider not configured')
    })

    it('does not fail the call when usage reporting throws', async () => {
        createChatModelMock.mockReturnValue(textModelReturning('still works'))
        const apiClient = makeApiClient({ reportAiUsage: vi.fn().mockRejectedValue(new Error('report down')) })
        const service = aiExecutionService({ log: makeLogger(), apiClient })

        const response = await service.executeAi({
            mode: ExecuteAiMode.TEXT,
            provider: AIProviderName.OPENAI,
            model: 'gpt-4.1',
            engineToken: 'tok',
            prompt: 'hi',
        })
        await flushMicrotasks()

        expect(response.text).toBe('still works')
    })
})

function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
}
