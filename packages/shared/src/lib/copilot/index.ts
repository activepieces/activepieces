import { Static, Type } from '@sinclair/typebox'

export const GenerateCodeRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateCodeRequest = Static<typeof GenerateCodeRequest>

export const GenerateCodeResponse = Type.Object({
    result: Type.String(),
})

export type GenerateCodeResponse = Static<typeof GenerateCodeResponse>