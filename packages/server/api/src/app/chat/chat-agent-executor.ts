import {
    AIProviderName,
    AzureProviderConfig,
    ChatConversation,
    ChatMessageRole,
    GetProviderConfigResponse,
    isNil,
    OpenAICompatibleProviderConfig,
    ToolCallRecord,
} from '@activepieces/shared'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModel, streamText } from 'ai'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { chatService } from './chat-service'

const MAX_STEPS = 20
const MAX_OUTPUT_TOKENS = 16384
const CHAT_TURN_TIMEOUT_MS = 300_000
const CONTEXT_WINDOW_MESSAGES = 50

export const chatAgentExecutor = (log: FastifyBaseLogger) => ({
    async execute({ conversation, platformId, reply }: ExecuteParams): Promise<void> {
        const abortController = new AbortController()
        const timeout = setTimeout(() => abortController.abort(), CHAT_TURN_TIMEOUT_MS)

        try {
            const [model, recentMessages] = await Promise.all([
                createLanguageModel({ conversation, platformId, log }),
                chatService(log).getRecentMessages({ conversationId: conversation.id, limit: CONTEXT_WINDOW_MESSAGES }),
            ])

            const coreMessages = recentMessages.map((msg) => ({
                role: msg.role === ChatMessageRole.USER ? 'user' as const : 'assistant' as const,
                content: msg.content,
            }))

            writeSseEvent({ reply, event: 'message_start', data: { role: 'assistant' } })

            let fullContent = ''
            const toolCalls: ToolCallRecord[] = []

            const result = streamText({
                model,
                messages: coreMessages,
                maxTokens: MAX_OUTPUT_TOKENS,
                maxSteps: MAX_STEPS,
                abortSignal: abortController.signal,
            })

            for await (const chunk of result.fullStream) {
                if (abortController.signal.aborted) break

                switch (chunk.type) {
                    case 'text-delta': {
                        fullContent += chunk.textDelta
                        writeSseEvent({ reply, event: 'content_delta', data: { text: chunk.textDelta } })
                        break
                    }
                    case 'tool-call': {
                        toolCalls.push({
                            toolName: chunk.toolName,
                            toolCallId: chunk.toolCallId,
                            input: chunk.args,
                        })
                        writeSseEvent({ reply, event: 'tool_call_start', data: {
                            toolCallId: chunk.toolCallId,
                            toolName: chunk.toolName,
                            input: chunk.args,
                        } })
                        break
                    }
                    case 'tool-result': {
                        writeSseEvent({ reply, event: 'tool_call_end', data: {
                            toolCallId: chunk.toolCallId,
                            output: chunk.result,
                        } })
                        break
                    }
                    case 'error': {
                        log.error({ error: chunk.error }, '[chatAgentExecutor] Stream error')
                        writeSseEvent({ reply, event: 'error', data: { message: 'An error occurred during generation' } })
                        break
                    }
                    default:
                        break
                }
            }

            const usage = await result.usage
            const tokenUsage = {
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
            }

            writeSseEvent({ reply, event: 'message_end', data: { tokenUsage } })

            await chatService(log).saveMessage({
                conversationId: conversation.id,
                role: ChatMessageRole.ASSISTANT,
                content: fullContent,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                tokenUsage,
            })
        }
        catch (error: unknown) {
            if (abortController.signal.aborted) {
                writeSseEvent({ reply, event: 'error', data: { message: 'Generation timed out' } })
            }
            else {
                log.error({ error }, '[chatAgentExecutor] Execution error')
                writeSseEvent({ reply, event: 'error', data: { message: 'An error occurred during generation' } })
            }
        }
        finally {
            clearTimeout(timeout)
        }
    },
})

function writeSseEvent({ reply, event, data }: { reply: FastifyReply, event: string, data: unknown }): void {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

async function createLanguageModel({ conversation, platformId, log }: {
    conversation: ChatConversation
    platformId: string
    log: FastifyBaseLogger
}): Promise<LanguageModel> {
    const providerName = conversation.modelProvider
    const modelId = conversation.modelName

    if (isNil(providerName) || isNil(modelId)) {
        const providers = await aiProviderService(log).listProviders(platformId)
        if (providers.length === 0) {
            throw new Error('No AI providers configured. Please configure an AI provider in platform settings.')
        }
        const firstProvider = providers[0]
        const models = await aiProviderService(log).listModels(platformId, firstProvider.provider)
        if (models.length === 0) {
            throw new Error(`No models available for provider ${firstProvider.provider}`)
        }
        return createModelFromConfig({
            providerConfig: await aiProviderService(log).getConfigOrThrow({ platformId, provider: firstProvider.provider }),
            modelId: models[0].id,
        })
    }

    const config = await aiProviderService(log).getConfigOrThrow({ platformId, provider: providerName as AIProviderName })
    return createModelFromConfig({ providerConfig: config, modelId })
}

function createModelFromConfig({ providerConfig, modelId }: { providerConfig: GetProviderConfigResponse, modelId: string }): LanguageModel {
    const { provider, auth, config } = providerConfig

    switch (provider) {
        case AIProviderName.OPENAI: {
            return createOpenAI({ apiKey: auth.apiKey }).chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            return createAnthropic({ apiKey: auth.apiKey })(modelId)
        }
        case AIProviderName.GOOGLE: {
            return createGoogleGenerativeAI({ apiKey: auth.apiKey })(modelId)
        }
        case AIProviderName.AZURE: {
            const azureConfig = config as AzureProviderConfig
            return createAzure({ resourceName: azureConfig.resourceName, apiKey: auth.apiKey }).chat(modelId)
        }
        case AIProviderName.CUSTOM: {
            const customConfig = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: customConfig.baseUrl,
                headers: {
                    ...(customConfig.defaultHeaders ?? {}),
                    [customConfig.apiKeyHeader]: auth.apiKey,
                },
            }).chatModel(modelId)
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            return createOpenRouter({ apiKey: auth.apiKey }).chat(modelId) as LanguageModel
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            return createOpenAI({ apiKey: auth.apiKey }).chat(modelId)
        }
    }
}

type ExecuteParams = {
    conversation: ChatConversation
    platformId: string
    reply: FastifyReply
}
