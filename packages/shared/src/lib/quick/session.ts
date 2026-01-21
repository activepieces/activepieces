import { Static, Type } from "@sinclair/typebox"
import { BaseModelSchema } from "../common"
import { ApId } from "../common/id-generator"
import { AssistantConversationContent, AssistantConversationMessage, ConversationMessage, UserConversationMessage } from "./message"

export const DEFAULT_CHAT_MODEL = 'openai/gpt-5.1' 

export const PlanItem = Type.Object({
    id: Type.String(),
    content: Type.String(),
    status: Type.Union([Type.Literal("pending"), Type.Literal("completed"), Type.Literal("in_progress") ]),
})
export type PlanItem = Static<typeof PlanItem>

export const ChatSession = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    plan: Type.Optional(Type.Array(PlanItem)),
    conversation: Type.Array(ConversationMessage),
    modelId: Type.String(),
    webSearchEnabled: Type.Boolean(),
    codeExecutionEnabled: Type.Boolean()
})
export type ChatSession = Static<typeof ChatSession>

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>

export const UpdateChatSessionRequest = Type.Object({
    modelId: Type.Optional(Type.String()),
    webSearchEnabled: Type.Optional(Type.Boolean()),
    codeExecutionEnabled: Type.Optional(Type.Boolean()),
})
export type UpdateChatSessionRequest = Static<typeof UpdateChatSessionRequest>

export const ChatSessionUpdate = Type.Object({
    sessionId: Type.String(),
    plan: Type.Optional(Type.Array(PlanItem)),
    part: AssistantConversationContent,
})
export type ChatSessionUpdate = Static<typeof ChatSessionUpdate>

export const ChatSessionEnded = Type.Object({
    sessionId: Type.String(),
})

export type ChatSessionEnded = Static<typeof ChatSessionEnded>

export const chatSessionUtils = {
    streamChunk(session: ChatSession, chunk: ChatSessionUpdate): ChatSession {
        const newConvo: ConversationMessage[] = [...session.conversation];
        const lastMessageIsAssistant = session.conversation.length > 0 && newConvo[newConvo.length - 1].role === 'assistant';
        if (!lastMessageIsAssistant) {
            newConvo.push({
                role: 'assistant',
                parts: [],
            });
        }
        const lastAssistantMessage = newConvo[newConvo.length - 1] as AssistantConversationMessage;
        const lastPartMatch = lastAssistantMessage.parts.length > 0 && lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1].type === chunk.part.type;
        if (lastPartMatch) {
            lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] = {
                ...lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1],
                ...chunk.part,
            } 
        } else {
            lastAssistantMessage.parts.push(chunk.part);
        }
        return {
            ...session,
            conversation: newConvo,
        }
    },
    addEmptyAssistantMessage(session: ChatSession): ChatSession {
        return {
            ...session,
            conversation: [...session.conversation, {
                role: 'assistant',
                parts: [],
            }],
        }
    },
    addUserMessage(
        session: ChatSession, 
        message: string, 
        files?: { name: string; type: string; url: string }[]
    ): ChatSession {
        const content: UserConversationMessage['content'] = []
        
        // Add text message if present
        if (message.trim()) {
            content.push({
                type: 'text',
                message,
            })
        }
        
        // Add file attachments
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    content.push({
                        type: 'image',
                        image: file.url,
                        name: file.name,
                    })
                } else {
                    content.push({
                        type: 'file',
                        file: file.url,
                        name: file.name,
                        mimeType: file.type,
                    })
                }
            }
        }
        
        return {
            ...session,
            conversation: [...session.conversation, {
                role: 'user',
                content,
            }],
        }
    }
}
