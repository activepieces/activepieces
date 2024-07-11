import { Static, Type } from '@sinclair/typebox'

export const CopilotGenerateRequest = Type.Object({
    prompt: Type.String(),
})

export type CopilotGenerateRequest = Static<typeof CopilotGenerateRequest>

export const GenerateCodeResponse = Type.Object({
    result: Type.String(),
})

export type GenerateCodeResponse = Static<typeof GenerateCodeResponse>


export const GenerateRequestBodyRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateRequestBodyRequest = Static<typeof GenerateRequestBodyRequest>

export const GenerateRequestBodyResponse = Type.Object({
    result: Type.String(),
})

export type GenerateRequestBodyResponse = Static<typeof GenerateRequestBodyResponse>