import { Static, Type } from '@sinclair/typebox'


export const GenerateCodeRequest = Type.Object({
    previousContext: Type.Array(Type.Object({
        role: Type.Union([Type.Literal('user'), Type.Literal('assistant')] ),
        content: Type.String(),
    })),
    prompt: Type.String(),
})

export type GenerateCodeRequest = Static<typeof GenerateCodeRequest>

export const GenerateCodeResponse = Type.Object({
    code: Type.String(),
    packageJson: Type.Object({
        dependencies: Type.Record(Type.String(), Type.String()),
    }),
    inputs: Type.Record(Type.String(), Type.String()),
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