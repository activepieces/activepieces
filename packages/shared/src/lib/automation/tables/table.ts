import { z } from 'zod'
import { BaseModelSchema, Nullable, NullableEnum } from '../../core/common'
import { Field } from './field'

export enum TableAutomationTrigger {
    ON_NEW_RECORD = 'ON_NEW_RECORD',
    ON_UPDATE_RECORD = 'ON_UPDATE_RECORD',
}

export enum TableAutomationStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const Table = z.object({
    ...BaseModelSchema,
    name: z.string(),
    folderId: Nullable(z.string()),
    projectId: z.string(),
    externalId: z.string(),
    status: NullableEnum(TableAutomationStatus),
    trigger: NullableEnum(TableAutomationTrigger),
})

export type Table = z.infer<typeof Table>


export const PopulatedTable = Table.extend({
    fields: z.array(Field),
})

export type PopulatedTable = z.infer<typeof PopulatedTable>
