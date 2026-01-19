import { Static, Type } from "@sinclair/typebox"
import { BaseModelSchema } from "../common"
import { ApId } from "../common/id-generator"
import { AssistantConversationContent, AssistantConversationMessage, ConversationMessage } from "./message"

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
    webSearchEnabled: Type.Boolean()
})
export type ChatSession = Static<typeof ChatSession>

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>

export const UpdateChatSessionRequest = Type.Object({ modelId: Type.String() })
export type UpdateChatSessionRequest = Static<typeof UpdateChatSessionRequest>

export const ToggleSearchToolRequest = Type.Object({ enabled: Type.Boolean() })
export type ToggleSearchToolRequest = Static<typeof ToggleSearchToolRequest>

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
    addUserMessage(session: ChatSession, message: string): ChatSession {
        return {
            ...session,
            conversation: [...session.conversation, {
                role: 'user',
                content: message,
            }],
        }
    }
}
