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

export const MCPProperty = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.String(),
    required: Type.Boolean(),
})

export type MCPProperty = Static<typeof MCPProperty>

export const MCP = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    token: ApId,
})

export type MCP = Static<typeof MCP> 

export type MCPSchema = MCP & {
    connections: AppConnectionWithoutSensitiveData[]
}
