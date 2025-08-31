import { Static, Type } from '@sinclair/typebox'

export enum PropertyExecutionType {
    MANUAL = 'MANUAL',
    DYNAMIC = 'DYNAMIC',
}

export const PropertySettings = Type.Object({
    type: Type.Enum(PropertyExecutionType),
    schema: Type.Optional(Type.Any()),
})
export type PropertySettings = Static<typeof PropertySettings>
