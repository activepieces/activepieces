import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export enum BuilderMessageRole {
    ASSISTANT = 'assistant',
    USER = 'user',
    TOOL = 'tool',
}

export const BuilderMessageRoleSchema = Type.Union([
    Type.Literal(BuilderMessageRole.ASSISTANT),
    Type.Literal(BuilderMessageRole.USER),
    Type.Literal(BuilderMessageRole.TOOL),
])

export const BuilderMessageUsage = Type.Object({
    inputTokens: Type.Number({ default: 0 }),
    outputTokens: Type.Number({ default: 0 }),
    totalTokens: Type.Number({ default: 0 }),
})
export type BuilderMessageUsage = Static<typeof BuilderMessageUsage>

export const BuilderMessage = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    flowId: Type.String(),
    role: BuilderMessageRoleSchema,
    content: Type.String(),
    usage: BuilderMessageUsage,
})
export type BuilderMessage = Static<typeof BuilderMessage>
