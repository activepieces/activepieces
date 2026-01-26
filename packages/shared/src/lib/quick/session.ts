import { Static, Type } from '@sinclair/typebox'
import { AgentStreamingUpdateProgressData, ExecuteAgentData } from '../generic-agents/dto'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { AssistantConversationMessage, ConversationMessage, UserConversationMessage } from './message'

export const DEFAULT_CHAT_MODEL = 'openai/gpt-5.1' 

export const ChatSession = Type.Composite([
    Type.Object({
        ...BaseModelSchema,
        userId: ApId,
    }),
    ExecuteAgentData,
])

export type ChatSession = Static<typeof ChatSession>

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>

export const UpdateChatSessionRequest = Type.Object({
    session: Type.Partial(ChatSession)
})
export type UpdateChatSessionRequest = Static<typeof UpdateChatSessionRequest>


export const chatSessionUtils = {
    streamChunk(session: ExecuteAgentData, chunk: AgentStreamingUpdateProgressData): ExecuteAgentData {
        const newConvo: ConversationMessage[] = [...(session.conversation ?? [])]
        const lastMessageIsAssistant = session.conversation && session.conversation.length > 0 && newConvo[newConvo.length - 1].role === 'assistant'
        if (!lastMessageIsAssistant) {
            newConvo.push({
                role: 'assistant',
                parts: [],
            })
        }
        const lastAssistantMessage = newConvo[newConvo.length - 1] as AssistantConversationMessage
        
        // For text parts, merge with the last text part (streaming behavior)
        // For tool-call and tool-result, find existing part by toolCallId or add new
        if (chunk.part.type === 'text') {
            const lastPart = lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1]
            if (lastPart && lastPart.type === 'text') {
                lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] = {
                    ...lastPart,
                    ...chunk.part,
                }
            } else {
                
                lastAssistantMessage.parts.push(chunk.part)
            }
        } else if (chunk.part.type === 'tool-call' || chunk.part.type === 'tool-result') {
            const toolCallId = chunk.part.toolCallId
            const partType = chunk.part.type
            const existingIndex = lastAssistantMessage.parts.findIndex(
                (part) => 
                    part.type === partType && 
                    'toolCallId' in part &&
                    part.toolCallId === toolCallId
            )
            if (existingIndex !== -1) {
                lastAssistantMessage.parts[existingIndex] = {
                    ...lastAssistantMessage.parts[existingIndex],
                    ...chunk.part,
                }
            } else {
                lastAssistantMessage.parts.push(chunk.part)
            }
        } else {
            lastAssistantMessage.parts.push(chunk.part)
        }
        
        return {
            ...session,
            conversation: newConvo,
        }
    },
    addEmptyAssistantMessage(session: ChatSession): ChatSession {
        return {
            ...session,
            conversation: [...(session.conversation ?? []), {
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
            conversation: [...(session.conversation ?? []), {
                role: 'user',
                content,
            }],
        }
    },
}
