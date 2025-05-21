import { Static, Type } from '@sinclair/typebox'
import { AppConnectionWithoutSensitiveData } from '../app-connection/app-connection'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { Flow } from '../flows/flow'

export type McpId = ApId

export enum McpPropertyType {
    TEXT = 'Text',
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    ARRAY = 'Array',
    OBJECT = 'Object',
}

export const Mcp = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: ApId,
    token: ApId,
})

export type Mcp = Static<typeof Mcp> 


export const McpProperty = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.String(),
    required: Type.Boolean(),
})

export type McpProperty = Static<typeof McpProperty>


export const McpPiece = Type.Object({
    ...BaseModelSchema,
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    actionNames: Type.Array(Type.String()),
    mcpId: ApId,
    connectionId: Type.Optional(ApId),
})

export type McpPiece = Static<typeof McpPiece>

export const McpPieceWithConnection = Type.Composite([
    McpPiece,
    Type.Object({
        connection: Type.Optional(AppConnectionWithoutSensitiveData),
    }),
])

export type McpPieceWithConnection = Static<typeof McpPieceWithConnection>


export const McpFlow = Type.Object({
    ...BaseModelSchema,
    flowId: ApId,
    mcpId: ApId,
})

export type McpFlow = Static<typeof McpFlow>

export const McpFlowWithFlow = Type.Composite([
    McpFlow,
    Type.Object({
        flow: Flow,
    }),
])

export type McpFlowWithFlow = Static<typeof McpFlowWithFlow>

export const McpWithTools = Type.Composite([
    Mcp,
    Type.Object({
        pieces: Type.Array(McpPieceWithConnection),
        flows: Type.Array(McpFlowWithFlow),
    }),
])

export type McpWithTools = Static<typeof McpWithTools>


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

export const fixSchemaNaming = (schemaName: string) => {
    return schemaName.replace(/\s+/g, '-')
}