import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, NullableEnum } from '../common'

export enum TableAutomationTrigger {
    ON_NEW_RECORD = 'ON_NEW_RECORD',
    ON_UPDATE_RECORD = 'ON_UPDATE_RECORD',
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
    status: NullableEnum(Type.Enum(TableAutomationStatus)),
    trigger: NullableEnum(Type.Enum(TableAutomationTrigger)),
})

export type Table = Static<typeof Table>

