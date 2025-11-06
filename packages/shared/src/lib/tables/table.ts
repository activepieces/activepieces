import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, NullableEnum } from '../common'
import { Field } from './field'

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


export const PopulatedTable = Type.Composite([
    Table,
    Type.Object({
        fields: Type.Array(Field),
    }),
])

export type PopulatedTable = Static<typeof PopulatedTable>