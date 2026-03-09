import { z } from 'zod'
import { FieldType } from '../field'


const StaticDropdownData = z.object({
    options: z.array(z.object({
        value: z.string(),
    })),
})

export const CreateFieldRequest = z.union([z.object({
    name: z.string(),
    type: z.literal(FieldType.STATIC_DROPDOWN),
    tableId: z.string(),
    data: StaticDropdownData,
    externalId: z.string().optional(),
}), z.object({
    name: z.string(),
    type: z.union([z.literal(FieldType.TEXT), z.literal(FieldType.NUMBER), z.literal(FieldType.DATE)]),
    tableId: z.string(),
    externalId: z.string().optional(),
})])

export const UpdateFieldRequest = z.object({
    name: z.string(),
})

export const ListFieldsRequestQuery = z.object({
    tableId: z.string(),
})

export type CreateFieldRequest = z.infer<typeof CreateFieldRequest>
export type UpdateFieldRequest = z.infer<typeof UpdateFieldRequest>
export type ListFieldsRequestQuery = z.infer<typeof ListFieldsRequestQuery>
