import { Static, Type } from '@sinclair/typebox'

export const ChatBotxRequest = Type.Object({
    message: Type.String(),
})
export type ChatBotxRequest = Static<typeof ChatBotxRequest>

export const ChatBotxResponse = Type.Object({
    content: Type.String(),
    inputTokens: Type.Number(),
    outputTokens: Type.Number(),
    totalTokens: Type.Number(),
})
export type ChatBotxResponse = Static<typeof ChatBotxResponse>

export const ChatBotxToken = Type.Object({
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
})
export type ChatBotxToken = Static<typeof ChatBotxToken>

export const ChatBotxTokenResponse = Type.Object({
    token: Type.String(),
})
export type ChatBotxTokenResponse = Static<typeof ChatBotxTokenResponse>

export const ChatBotxUserMessage = Type.Object({
    speaker: Type.String(),
    content: Type.String(),
})
export type ChatBotxUserMessage = Static<typeof ChatBotxUserMessage>
