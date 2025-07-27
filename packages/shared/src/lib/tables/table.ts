import { Static, Type } from '@sinclair/typebox'
import { Agent } from '../agents'
import { BaseModelSchema, NullableEnum } from '../common'

export enum TableAutomationTrigger {
    ON_NEW_RECORD = 'ON_NEW_RECORD',
    ON_UPDATE_RECORD = 'ON_UPDATE_RECORD',
    ON_DEMAND = 'ON_DEMAND',
}

export enum TableAutomationStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const Table = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: Type.String(),
    externalId: Type.String(),
    agent: Type.Optional(Agent),
    status: NullableEnum(Type.Enum(TableAutomationStatus)),
    trigger: NullableEnum(Type.Enum(TableAutomationTrigger)),
    agentId: Type.String(),
})

export type Table = Static<typeof Table>

