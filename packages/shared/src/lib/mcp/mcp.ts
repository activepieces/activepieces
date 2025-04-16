import { Static, Type } from '@sinclair/typebox'
import { AppConnectionWithoutSensitiveData } from '../app-connection/app-connection'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'

export enum MCPProperyType {
    TEXT = 'Text',
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    ARRAY = 'Array',
    OBJECT = 'Object',
}

export enum MCPPieceStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const MCPProperty = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.String(),
    required: Type.Boolean(),
})

export type MCPProperty = Static<typeof MCPProperty>


export const MCPPiece = Type.Object({
    ...BaseModelSchema,
    pieceName: Type.String(),
    connectionId: Type.Optional(ApId),
    mcpId: ApId,
    status: Type.Optional(Type.Enum(MCPPieceStatus)),
})

export type MCPPiece = Static<typeof MCPPiece>

export const MCPPieceWithConnection = Type.Composite([
    MCPPiece,
    Type.Object({
        connection: Type.Optional(AppConnectionWithoutSensitiveData),
    }),
])

export type MCPPieceWithConnection = Static<typeof MCPPieceWithConnection>



export const MCP = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    token: ApId,
})

export type MCP = Static<typeof MCP> 

export const MCPWithPieces = Type.Composite([
    MCP,
    Type.Object({
        pieces: Type.Array(MCPPieceWithConnection),
    }),
])

export type MCPWithPieces = Static<typeof MCPWithPieces>


export const MCPTrigger = Type.Object({
    pieceName: Type.String(),
    triggerName: Type.String(),
    input: Type.Object({
        toolName: Type.String(),
        toolDescription: Type.String(),
        inputSchema: Type.Array(MCPProperty),
        returnsResponse: Type.Boolean(),
    }),
})

export type MCPTrigger = Static<typeof MCPTrigger>
