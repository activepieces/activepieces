import { Static, Type } from '@sinclair/typebox'
import { ExecuteAgentData } from '../generic-agents/dto'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { AgentTool } from '../agents'
import { Conversation, ConversationMessage } from '../generic-agents/message'

export const DEFAULT_CHAT_MODEL = 'openai/gpt-5.1'

export const ChatSession = Type.Object({
  ...BaseModelSchema,
  userId: ApId,
  tools: Type.Array(AgentTool),
  modelId: Type.String(),
  state: Type.Record(Type.String(), Type.Any()),
  conversation: Type.Optional(Conversation),
  structuredOutput: Type.Optional(Type.Record(Type.String(), Type.Any())),
})

export type ChatSession = Static<typeof ChatSession> & ExecuteAgentData

export const CreateChatSessionRequest = Type.Object({})
export type CreateChatSessionRequest = Static<typeof CreateChatSessionRequest>



export const UpdateChatSessionRequest = Type.Object({
  prompt: Type.Optional(Type.String()),
  tools: Type.Optional(Type.Array(AgentTool)),
  modelId: Type.Optional(Type.String()),
  state: Type.Optional(Type.Record(Type.String(), Type.Any())),
  structuredOutput: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
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
})

export type ChatWithQuickRequest = Static<typeof ChatWithQuickRequest>
