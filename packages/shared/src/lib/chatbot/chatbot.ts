import { Static, Type } from '@sinclair/typebox';
import { DataSource } from './datasource';
import { BaseModelSchema } from '../common';

export enum VisibilityStatus {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE"
}

export const Chatbot = Type.Object({
  ...BaseModelSchema,
  type: Type.String(),
  displayName: Type.String(),
  projectId: Type.String(),
  connectionId: Type.String(),
  prompt: Type.String(),
  visibilityStatus: Type.Enum(VisibilityStatus),
  dataSources: Type.Array(DataSource)
});

export type Chatbot = Static<typeof Chatbot>;

export type ChatbotMetadata = Pick<Chatbot, 'id' | 'displayName' | 'created' | 'updated'>

export const CreateChatBotRequest = Type.Object({
  type: Type.String()
});

export type CreateChatBotRequest = Static<typeof CreateChatBotRequest>;

export const UpdateChatbotRequest = Type.Object({
  displayName: Type.String(),
  prompt: Type.String(),
  visibilityStatus: Type.Enum(VisibilityStatus),
  connectionId: Type.Union([Type.Null(), Type.String()]),
});

export type UpdateChatbotRequest = Static<typeof UpdateChatbotRequest>;

export const ListChatbotsRequest = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number())
});

export type ListChatbotsRequest = Static<typeof ListChatbotsRequest>;

export const ChatbotResponse = Type.Object({
  output: Type.String()
});

export type ChatbotResponse = Static<typeof ChatbotResponse>;

export const APChatMessage = Type.Object({
  role:Type.Union([Type.Literal('user'),Type.Literal('bot')]),
  text:Type.String()
})
export type APChatMessage = Static<typeof APChatMessage>;

export const AskChatBotRequest = Type.Object({
  chatbotId:Type.String(),
  input: Type.String(),
  history: Type.Array(APChatMessage)
})
export type AskChatBotRequest = Static<typeof AskChatBotRequest>;