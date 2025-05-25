import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { McpToolWithFlow, McpToolWithPiece } from './tools/mcp-tool'

export type McpId = ApId

export const Mcp = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: ApId,
    token: ApId,
})


export const McpWithTools = Type.Composite([
    Mcp,
    Type.Object({
        tools: Type.Array(Type.Union([McpToolWithFlow, McpToolWithPiece ])),
    }),
])



export const fixSchemaNaming = (schemaName: string) => {
    return schemaName.replace(/\s+/g, '-')
}

export type Mcp = Static<typeof Mcp> 
export type McpWithTools = Static<typeof McpWithTools>
