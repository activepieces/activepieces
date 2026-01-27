import { Static, Type } from "@sinclair/typebox"
import { ApId } from "../common/id-generator"
import { BaseModelSchema } from "../common"

export const ConversationMessageSchema = Type.Union([
  Type.Object({
      role: Type.Literal('user'),
      content: Type.Array(Type.Union([
          Type.Object({
              type: Type.Literal('text'),
              message: Type.String(),
          }),
          Type.Object({
              type: Type.Literal('image'),
              image: Type.String(),
              name: Type.Optional(Type.String()),
          }),
          Type.Object({
              type: Type.Literal('file'),
              file: Type.String(),
              name: Type.Optional(Type.String()),
              mimeType: Type.Optional(Type.String()),
          }),
      ])),
  }),
  Type.Object({
      role: Type.Literal('assistant'),
      parts: Type.Array(Type.Union([
          Type.Object({
              type: Type.Literal('text'),
              message: Type.String(),
              isStreaming: Type.Boolean(),
          }),
          Type.Object({
              type: Type.Literal('tool-call'),
              toolCallId: Type.String(),
              toolName: Type.String(),
              input: Type.Optional(Type.Record(Type.String(), Type.Any())),
              output: Type.Optional(Type.Record(Type.String(), Type.Any())),
              status: Type.Union([
                  Type.Literal('loading'),
                  Type.Literal('ready'),
                  Type.Literal('completed'),
                  Type.Literal('error'),
              ]),
              error: Type.Optional(Type.String()),
          }),
      ])),
  }),
])

export const ChatConversationSchema = Type.Object({
  ...BaseModelSchema,
  title: Type.String(),
  sessionId: ApId,
  conversation: Type.Array(ConversationMessageSchema),
})
export type ChatConversation = Static<typeof ChatConversationSchema>