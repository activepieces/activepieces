import { Static, Type } from '@sinclair/typebox';
import { DataSource } from './datasource';
import { BaseModelSchema } from '@activepieces/shared';

export const Chatbot = Type.Object({
  ...BaseModelSchema,
  type: Type.String(),
  displayName: Type.String(),
  projectId: Type.String(),
  connectionId: Type.String(),
  prompt: Type.String(),
  dataSources: Type.Array(DataSource)
});

export type Chatbot = Static<typeof Chatbot>;

export const CreateChatBotRequest = Type.Object({
  type: Type.String()
});

export type CreateChatBotRequest = Static<typeof CreateChatBotRequest>;

export const UpdateChatbotRequest = Type.Object({
  displayName: Type.String(),
  prompt: Type.String(),
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
