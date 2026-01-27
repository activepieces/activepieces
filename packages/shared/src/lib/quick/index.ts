import { Static, Type } from '@sinclair/typebox'
import {  ExecuteAgentData } from '../generic-agents/dto'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { ChatConversationSchema } from './conversation'

export * from './conversation'

export const DEFAULT_CHAT_MODEL = 'openai/gpt-5.1' 

export const ChatSession = Type.Composite([
    Type.Object({
        ...BaseModelSchema,
        userId: ApId,
    }),
    Type.Object({
        tools: Type.Array(Type.Any()),
        modelId: Type.String(),
        state: Type.Record(Type.String(), Type.Any()),
        structuredOutput: Type.Optional(Type.Record(Type.String(), Type.Any())),
        conversations: Type.Optional(Type.Array(ChatConversationSchema)),
    }),
])

export type ChatSession = Static<typeof ChatSession>

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>

export const UpdateChatSessionRequest = Type.Object({
    session: Type.Partial(ChatSession)
})
export type UpdateChatSessionRequest = Static<typeof UpdateChatSessionRequest>


export const ChatFileAttachment = Type.Object({
  name: Type.String(),
  mimeType: Type.String(),
  url: Type.String(),
})
export type ChatFileAttachment = Static<typeof ChatFileAttachment>


export const ChatWithQuickRequest = Type.Object({
  message: Type.String(),
  files: Type.Optional(Type.Array(ChatFileAttachment)),
  conversationId: Type.Optional(ApId),
})

export type ChatWithQuickRequest = Static<typeof ChatWithQuickRequest>
