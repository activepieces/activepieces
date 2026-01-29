import { Static, Type } from "@sinclair/typebox"
import { AgentTool } from "../agents/tools"
import { DiscriminatedUnion } from "../common"
import { AssistantConversationContent, ConversationMessage } from "./message"
import { AIProviderName } from "../ai-providers"
import { AgentOutputField } from "../agents"

export const AgentSession = Type.Object({
  systemPrompt: Type.String(),
  tools: Type.Array(AgentTool),
  modelId: Type.String(),
  provider: Type.Enum(AIProviderName),
  state: Type.Record(Type.String(), Type.Unknown()),
  conversation: Type.Optional(Type.Array(ConversationMessage)),
  structuredOutput: Type.Optional(Type.Array(AgentOutputField)),
})
export type AgentSession = Static<typeof AgentSession>

export const ExecuteAgentRequest = Type.Composite([
  Type.Object({ projectId: Type.String() }),
  AgentSession,
])

export type ExecuteAgentRequest = Static<typeof ExecuteAgentRequest>

export enum AgentStreamingEvent {
  AGENT_STREAMING_UPDATE = 'AGENT_STREAMING_UPDATE',
  AGENT_STREAMING_ENDED = 'AGENT_STREAMING_ENDED',
}

export const AgentStreamingUpdateProgressData = Type.Object({
  sessionId: Type.Optional(Type.String()),
  part: AssistantConversationContent,
})
export type AgentStreamingUpdateProgressData = Static<typeof AgentStreamingUpdateProgressData>

export const AgentStreamingUpdateEndedData = Type.Composite([Type.Object({
  sessionId: Type.Optional(Type.String()),
}), AgentSession])
export type AgentStreamingUpdateEndedData = Static<typeof AgentStreamingUpdateEndedData>

const AgentStreamingUpdateProgress = Type.Object({
  event: Type.Literal(AgentStreamingEvent.AGENT_STREAMING_UPDATE),
  data: AgentStreamingUpdateProgressData,
})

const AgentStreamingUpdateEnded = Type.Object({
  event: Type.Literal(AgentStreamingEvent.AGENT_STREAMING_ENDED),
  // data: AgentStreamingUpdateEndedData,
})

export const AgentStreamingUpdate = DiscriminatedUnion("event", [ AgentStreamingUpdateProgress, AgentStreamingUpdateEnded ])
export type AgentStreamingUpdate = Static<typeof AgentStreamingUpdate>