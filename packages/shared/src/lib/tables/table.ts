import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Agent } from '../agents'

export enum TableAutomationTrigger {
    ON_NEW_RECORD = 'ON_NEW_RECORD',
    ON_UPDATE_RECORD = 'ON_UPDATE_RECORD',
    ON_DEMAND = 'ON_DEMAND',
}


export const Table = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: Type.String(),
    externalId: Type.String(),
    agent: Type.Optional(Agent),
    trigger: Type.Enum(TableAutomationTrigger),
    agentId: Type.String(),
})

export type Table = Static<typeof Table>

