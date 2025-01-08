import { Static, Type } from '@sinclair/typebox'

export enum AskCopilotTool {
    GENERATE_CODE = 'generate_code',
    GENERATE_HTTP_REQUEST = 'generate_http_request',
}

export const AskCopilotRequest = Type.Object({
    context: Type.Array(Type.Object({
        role: Type.Union([Type.Literal('user'), Type.Literal('assistant')]),
        content: Type.String(),
    })),
    selectedStepName: Type.Optional(Type.String()),
    flowVersionId: Type.String(),
    flowId: Type.String(),
    prompt: Type.String(),
    tools: Type.Array(Type.Enum(AskCopilotTool)),
})

export type AskCopilotRequest = Static<typeof AskCopilotRequest>

export const AskCopilotCodeResponse = Type.Object({
    code: Type.String(),
    packageJson: Type.Object({
        dependencies: Type.Record(Type.String(), Type.String()),
    }),
    inputs: Type.Record(Type.String(), Type.String()),
    icon: Type.Optional(Type.String()),
    title: Type.String(),
    textMessage: Type.Optional(Type.String()),
})

export type AskCopilotCodeResponse = Static<typeof AskCopilotCodeResponse>

export const AskCopilotHttpRequestResponse = Type.Object({
    headers: Type.Record(Type.String(), Type.String()),
    body: Type.String(),
    statusCode: Type.Number(),
    queryParams: Type.Record(Type.String(), Type.String()),
    method: Type.String(),
    url: Type.String(),
})

export type AskCopilotHttpRequestResponse = Static<typeof AskCopilotHttpRequestResponse>

export const AskCopilotResponse = Type.Union([
    AskCopilotCodeResponse,
    AskCopilotHttpRequestResponse,
])

export type AskCopilotResponse = Static<typeof AskCopilotResponse>
