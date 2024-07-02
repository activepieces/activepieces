import { Static, Type } from '@sinclair/typebox'

export const GenerateCodeRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateCodeRequest = Static<typeof GenerateCodeRequest>

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