import { securityAccess } from '@activepieces/server-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { ModelMessage, streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { ChatWithQuickRequest, ConversationMessage, PrincipalType, QuickStreamingUpdate, TextConversationMessage, WebsocketClientEvent } from '@activepieces/shared'
import { websocketService } from '../core/websockets.service'

function getAgentSystemPrompt(): string {
    return `
You are a helpful, proactive AI assistant designed to assist users efficiently and accurately.
Today's date is ${new Date().toISOString().split('T')[0]}.

**Core Objective**:
- Help the user achieve their goal as quickly, accurately, and thoroughly as possible.
- Always prioritize user satisfaction by providing clear, concise, and relevant responses.
- Always make sure when u are asked a direct simple question you replay to it in simple clear and consize text response.

**Reasoning and Thinking Guidelines**:
- Think step-by-step before taking any action. Use chain-of-thought reasoning: First, understand the user's query fully. Then, break it down into sub-tasks. Evaluate what information or actions are needed. Finally, decide on the next steps.
- Be analytical: Consider potential edge cases, ambiguities in the query, and how to clarify if needed (but prefer acting proactively if possible).
- Avoid assumptions: Base decisions on available information, tools, and prior responses. If something is unclear, use tools to gather more data rather than guessing.

**Final Response and Completion**:
- Once the goal is achieved or unachievable, summarize findings clearly in a final response if needed.
`.trim()
}


export const quickController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/chat', ChatRequest, async (request, reply) => {

        const userId = request.principal.id
        const { fullStream } = streamText({
            model: createAnthropic().chat('claude-opus-4-5-20251101'),
            system: getAgentSystemPrompt(),
            messages: [
                ...convertHistory(request.body.history),
                {
                    role: 'user',
                    content: request.body.message,
                },
            ],
        })

        let isStreaming = false;
        let previousText = ''
        for await (const chunk of fullStream) {
            switch (chunk.type) {
                case 'text-start': {
                    previousText = ''
                    isStreaming = true;
                    break;
                }
                case 'text-end': {
                    isStreaming = false;
                    break;
                }
                case 'text-delta': {
                    previousText += chunk.text
                    break;
                }
                default: {
                    break;
                }
            }

            const quickStreamingUpdate: QuickStreamingUpdate = {
                sessionId: request.body.sessionId,
                part: {
                    type: 'text',
                    message: previousText,
                    isStreaming: isStreaming,
                }
            }
            websocketService.to(userId).emit(WebsocketClientEvent.QUICK_STREAMING_UPDATE, quickStreamingUpdate)
        }

        websocketService.to(userId).emit(WebsocketClientEvent.QUICK_STREAMING_ENDED, {
            sessionId: request.body.sessionId,
        })

        return {}
    })

}

function convertHistory(history: ConversationMessage[]): ModelMessage[] {
    return history.map((message) => {
        if (message.role === 'user') {
            return {
                role: 'user',
                content: message.content,
            }
        }
        return {
            role: 'assistant',
            content: message.parts.filter((item) => item.type !== 'plan').map((item) => {
                return {
                    type: item.type,
                    text: item.message,
                }
            }),
        }
    })
}

const ChatRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: ChatWithQuickRequest,
    },
}

