import { Static, Type, Unknown } from "@sinclair/typebox"
import { AgentTool } from "../agents/tools"
import { DiscriminatedUnion } from "../common"
import { AssistantConversationContent, ConversationMessage } from "./message"
import { Tool } from "ai"

export const ExecuteAgentData = Type.Object({
  systemPrompt: Type.String(),
  prompt: Type.String(),
  tools: Type.Array(AgentTool),
  toolSet: Type.Optional(Type.Record(Type.String(), Type.Unknown())), // workaround . should not exist after moving inputSchema creation from engine to worker
  modelId: Type.String(),
  state: Type.Record(Type.String(), Type.Unknown()),
  conversation: Type.Optional(Type.Array(ConversationMessage)),
  structuredOutput: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
})
export type ExecuteAgentData = Static<typeof ExecuteAgentData> & {
  toolSet?: Record<string, Tool>
}

export const ExecuteAgentRequest = Type.Composite([
  Type.Object({ projectId: Type.String() }),
  ExecuteAgentData,
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
}), ExecuteAgentData])
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