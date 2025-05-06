import { Static, Type } from '@sinclair/typebox'
import { AppConnectionWithoutSensitiveData } from '../app-connection/app-connection'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'

export enum McpPropertyType {
    TEXT = 'Text',
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    ARRAY = 'Array',
    OBJECT = 'Object',
}

export enum McpPieceStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

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
    connectionId: Type.Optional(ApId),
    mcpId: ApId,
    status: Type.Optional(Type.Enum(McpPieceStatus)),
})

export type McpPiece = Static<typeof McpPiece>

export const McpPieceWithConnection = Type.Composite([
    McpPiece,
    Type.Object({
        connection: Type.Optional(AppConnectionWithoutSensitiveData),
    }),
])

export type McpPieceWithConnection = Static<typeof McpPieceWithConnection>



export const Mcp = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    token: ApId,
})

export type Mcp = Static<typeof Mcp> 

export const McpWithPieces = Type.Composite([
    Mcp,
    Type.Object({
        pieces: Type.Array(McpPieceWithConnection),
    }),
])

export type McpWithPieces = Static<typeof McpWithPieces>


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