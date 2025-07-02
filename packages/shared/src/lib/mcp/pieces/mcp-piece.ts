import { Static, Type } from '@sinclair/typebox'

export enum McpPropertyType {
    TEXT = 'Text',
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    ARRAY = 'Array',
    OBJECT = 'Object',
}

export const McpProperty = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.String(),
    required: Type.Boolean(),
})

export type McpProperty = Static<typeof McpProperty>

export const McpTrigger = Type.Object({
    pieceName: Type.String(),
    triggerName: Type.String(),
    input: Type.Object({
        toolName: Type.String(),
        toolDescription: Type.String(),
        inputSchema: Type.Array(McpProperty),
        returnsResponse: Type.Boolean(),
    }),
})

export type McpTrigger = Static<typeof McpTrigger>

