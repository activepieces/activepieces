import { Static, Type } from '@sinclair/typebox'

export const GenerateCodeRequest = Type.Object({
    prompt: Type.String(),
})

export type GenerateCodeRequest = Static<typeof GenerateCodeRequest>

export const GenerateCodeResponse = Type.Object({
    result: Type.String(),
})

export type GenerateCodeResponse = Static<typeof GenerateCodeResponse>

export enum OpenAIRole {
    USER = 'user',
    SYSTEM = 'system',
    ASSISTANT = 'assistant',
    TOOL = 'tool',
}

export const GenerateHttpRequestDetailsRequest = Type.Object({
    prompt: Type.String(),
    docsUrl: Type.String(),
})

export type GenerateHttpRequestDetailsRequest = Static<typeof GenerateHttpRequestDetailsRequest>
  
export const GenerateHttpRequestDetailsResponse = Type.Object({
    result: Type.String(),
})

export type GenerateHttpRequestDetailsResponse = Static<typeof GenerateHttpRequestDetailsResponse>