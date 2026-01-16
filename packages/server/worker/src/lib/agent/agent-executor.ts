import { ChatSessionUpdate, chatSessionUtils, ConversationMessage, ExecuteAgentJobData, ChatSession, WebsocketClientEvent, WebsocketServerEvent, ChatSessionEnded, EmitAgentStreamingEndedRequest } from "@activepieces/shared";
import { ModelMessage, streamText } from "ai";
import { systemPrompt } from "./system-prompt";
import { createAnthropic } from "@ai-sdk/anthropic";
import { appSocket } from "../app-socket";
import { FastifyBaseLogger } from "fastify";

export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData) {
        const { conversation } = data.session;
        const { fullStream } = streamText({
            model: createAnthropic().chat('claude-opus-4-5-20251101'),
            system: systemPrompt(),
            messages: convertHistory(conversation),
        })

        let newSession: ChatSession = data.session;
        let isStreaming = false;
        let previousText = ''
        for await (const chunk of fullStream) {
            switch (chunk.type) {
                case 'text-start': {
                    isStreaming = true;
                    previousText = '';
                    break;
                }
                case 'text-delta': {
                    previousText += chunk.text;
                    break;
                }
                case 'text-end': {
                    isStreaming = false;
                    break;
                }
                default: {
                    break;
                }
            }
            const quickStreamingUpdate: ChatSessionUpdate = {
                sessionId: data.session.id,
                part: {
                    type: 'text',
                    message: previousText,
                    isStreaming: isStreaming,
                }
            }
            await appSocket(log).emitWithAck(WebsocketServerEvent.EMIT_AGENT_PROGRESS, {
                userId: data.session.userId,
                event: WebsocketClientEvent.AGENT_STREAMING_UPDATE,
                data: quickStreamingUpdate,
            })
            newSession = chatSessionUtils.streamChunk(newSession, quickStreamingUpdate);
        }
        const chatSessionEnded: EmitAgentStreamingEndedRequest = {
            userId: data.session.userId,
            event: WebsocketClientEvent.AGENT_STREAMING_ENDED,
            data: {
                session: newSession,
            },
        }
        await appSocket(log).emitWithAck(WebsocketServerEvent.EMIT_AGENT_PROGRESS, chatSessionEnded)
    },
})

function convertHistory(conversation: ConversationMessage[]): ModelMessage[] {
    return conversation.map(message => {
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