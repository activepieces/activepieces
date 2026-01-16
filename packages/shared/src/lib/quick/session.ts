import { Static, Type } from "@sinclair/typebox"
import { BaseModelSchema } from "../common"
import { ApId } from "../common/id-generator"
import { AssistantConversationContent, AssistantConversationMessage, ConversationMessage, PlanConversationMessage } from "./message"

export const ChatSession = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    plan: Type.Optional(PlanConversationMessage),
    conversation: Type.Array(ConversationMessage),
})
export type ChatSession = Static<typeof ChatSession>

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>

export const ChatSessionUpdate = Type.Object({
    sessionId: Type.String(),
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
