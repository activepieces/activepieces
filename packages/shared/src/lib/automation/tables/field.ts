import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    STATIC_DROPDOWN = 'STATIC_DROPDOWN',
}

export const Field = z.union([z.object({
    ...BaseModelSchema,
    name: z.string(),
    externalId: z.string(),
    type: z.literal(FieldType.STATIC_DROPDOWN),
    tableId: z.string(),
    projectId: z.string(),
    data: z.object({
        options: z.array(z.object({
            value: z.string(),
        })),
    }),
}), z.object({
    ...BaseModelSchema,
    name: z.string(),
    externalId: z.string(),
    type: z.union([z.literal(FieldType.TEXT), z.literal(FieldType.NUMBER), z.literal(FieldType.DATE)]),
    tableId: z.string(),
    projectId: z.string(),
})])

export type Field = z.infer<typeof Field>

export const StaticDropdownEmptyOption = {
    label: '',
    value: '',
}
