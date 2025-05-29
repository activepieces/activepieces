import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { McpTool } from './tools/mcp-tool'

export type McpId = ApId

export const Mcp = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: ApId,
    token: ApId,
})

export type Mcp = Static<typeof Mcp>

export const McpWithTools = Type.Composite([
    Mcp,
    Type.Object({
        tools: Type.Array(McpTool),
    }),
])


const MAX_TOOL_NAME_LENGTH = 47


export const mcpToolNaming = {
    fixTool: (schemaName: string) => {
        return schemaName.replace(/[\s/@]+/g, '-').slice(0, MAX_TOOL_NAME_LENGTH) 
    },
    fixProperty: (schemaName: string) => {
        return schemaName.replace(/[\s/@]+/g, '-')
    },
}



export type McpWithTools = Static<typeof McpWithTools>
