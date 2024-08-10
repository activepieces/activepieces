import { Static, Type } from '@sinclair/typebox'

export const GenerateCodeRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateCodeRequest = Static<typeof GenerateCodeRequest>

export const GenerateCodeResponse = Type.Object({
    result: Type.String(),
})

export type GenerateCodeResponse = Static<typeof GenerateCodeResponse>


export const GenerateHttpRequestBodyRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateHttpRequestBodyRequest = Static<typeof GenerateHttpRequestBodyRequest>

export const GenerateHttpRequestBodyResponse = Type.Object({
    result: Type.String(),
})

export type GenerateHttpRequestBodyResponse = Static<typeof GenerateHttpRequestBodyResponse>