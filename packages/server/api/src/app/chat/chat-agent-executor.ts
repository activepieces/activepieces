import {
    AIProviderName,
    AzureProviderConfig,
    ChatConversation,
    ChatMessageRole,
    GetProviderConfigResponse,
    isNil,
    OpenAICompatibleProviderConfig,
} from '@activepieces/shared'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModel, stepCountIs, streamText, Tool } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from '../mcp/mcp-service'
import { chatService } from './chat-service'

const MAX_STEPS = 20
const MAX_OUTPUT_TOKENS = 16384
const CONTEXT_WINDOW_MESSAGES = 50

const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into Activepieces, an automation platform. You have access to tools that let you interact with the user's project — listing flows, creating tables, querying records, managing automations, and more. Use these tools when the user asks you to do something that requires interacting with their project. Always be helpful, concise, and action-oriented.`

export const chatAgentExecutor = (log: FastifyBaseLogger) => ({
    async executeStream({ conversation, platformId }: ExecuteParams) {
        const [model, recentMessages, mcpTools] = await Promise.all([
            createLanguageModel({ conversation, platformId, log }),
            chatService(log).getRecentMessages({ conversationId: conversation.id, limit: CONTEXT_WINDOW_MESSAGES }),
            connectToProjectMcp({ projectId: conversation.projectId, log }),
        ])

        const coreMessages = recentMessages.map((msg) => ({
            role: msg.role === ChatMessageRole.USER ? 'user' as const : 'assistant' as const,
            content: msg.content,
        }))

        const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: coreMessages,
            tools: mcpTools.tools,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            stopWhen: [stepCountIs(MAX_STEPS)],
            onFinish: async ({ text, usage }) => {
                if (mcpTools.client) {
                    await mcpTools.client.close().catch(() => {})
                }
                await chatService(log).saveMessage({
                    conversationId: conversation.id,
                    role: ChatMessageRole.ASSISTANT,
                    content: text,
                    tokenUsage: {
                        inputTokens: usage.inputTokens ?? 0,
                        outputTokens: usage.outputTokens ?? 0,
                    },
                })
            },
        })

        return result
    },
})

async function connectToProjectMcp({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<{ client: Awaited<ReturnType<typeof createMCPClient>> | null, tools: Record<string, Tool> }> {
    try {
        const mcpServer = await mcpServerService(log).getByProjectId(projectId)
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        const mcpUrl = `${frontendUrl}/api/v1/projects/${projectId}/mcp-server/http`

        const client = await createMCPClient({
            transport: new StreamableHTTPClientTransport(new URL(mcpUrl), {
                requestInit: {
                    headers: {
                        Authorization: `Bearer ${mcpServer.token}`,
                    },
                },
            }),
        })

        const tools = await client.tools()
        return { client, tools: tools as Record<string, Tool> }
    }
    catch (error) {
        log.warn({ error }, '[chatAgentExecutor] Failed to connect to project MCP server, proceeding without tools')
        return { client: null, tools: {} }
    }
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
}
