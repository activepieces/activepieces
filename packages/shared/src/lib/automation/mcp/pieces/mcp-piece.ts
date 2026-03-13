import { z } from 'zod'

export enum McpPropertyType {
    TEXT = 'Text',
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    ARRAY = 'Array',
    OBJECT = 'Object',
}

export const McpProperty = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    required: z.boolean(),
})

export type McpProperty = z.infer<typeof McpProperty>

export const McpTrigger = z.object({
    pieceName: z.string(),
    triggerName: z.string(),
    input: z.object({
        toolName: z.string(),
        toolDescription: z.string(),
        inputSchema: z.array(McpProperty),
        returnsResponse: z.boolean(),
    }),
})

export type McpTrigger = z.infer<typeof McpTrigger>

