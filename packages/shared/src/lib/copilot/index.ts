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

export const GenerateHttpRequestDetailsOpenAIResponse = Type.Object({
    url: Type.String(),
    bod: Type.Optional(Type.Any()),
    headers: Type.Optional(Type.Record(Type.String(), Type.String())),
    queryParams: Type.Optional(Type.Record(Type.String(), Type.String())),
    method: Type.Union([Type.Literal('GET'), Type.Literal('POST'), Type.Literal('PATCH'), Type.Literal('PUT'), Type.Literal('DELETE'), Type.Literal('HEAD')]),
    body_type: Type.Optional(Type.Union([Type.Literal('none'), Type.Literal('json'), Type.Literal('raw'), Type.Literal('form_data')])),
})

export type GenerateHttpRequestDetailsOpenAIResponse = Static<typeof GenerateHttpRequestDetailsOpenAIResponse>
  
export const GenerateHttpRequestDetailsResponse = Type.Object({
    result: GenerateHttpRequestDetailsOpenAIResponse,
})

export type GenerateHttpRequestDetailsResponse = Static<typeof GenerateHttpRequestDetailsResponse>