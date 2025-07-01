import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { McpTool, McpToolType } from './tools/mcp-tool'

export type McpId = ApId

export const Mcp = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: ApId,
    token: ApId,
    agentId: Type.Optional(ApId),
})

export type Mcp = Static<typeof Mcp>

export const McpWithTools = Type.Composite([
    Mcp,
    Type.Object({
        tools: Type.Array(McpTool),
    }),
])


const MAX_TOOL_NAME_LENGTH = 47

export const McpToolMetadata = Type.Object({
    displayName: Type.String(),
    logoUrl: Type.Optional(Type.String()),
})

export type McpToolMetadata = Static<typeof McpToolMetadata>


export const mcpToolNaming = {
    fixTool: (name: string, id: string, type: McpToolType) => {
        const spaceToReserve = id.length + 1
        const baseName = name.replace(/[\s/@-]+/g, '_')
        switch (type) {
            case McpToolType.FLOW:
                return `${baseName.slice(0, MAX_TOOL_NAME_LENGTH - spaceToReserve)}_${id}`
            case McpToolType.PIECE:{
                return `${baseName.slice(0, MAX_TOOL_NAME_LENGTH - spaceToReserve)}_${id}` 
            }
        }
    },
    fixProperty: (schemaName: string) => {
        return schemaName.replace(/[\s/@-]+/g, '_')
    },
    extractToolId: (toolName: string) => {
        const splitted = toolName.split('_')
        return splitted[splitted.length - 1]
    },
}



export type McpWithTools = Static<typeof McpWithTools>
