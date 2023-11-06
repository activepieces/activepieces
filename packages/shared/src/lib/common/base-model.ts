import { Type } from '@sinclair/typebox'

export type BaseModel<T> = {
    id: T
    created: string
    updated: string
}

export const BaseModelSchema = {
    id: Type.String(),
    created: Type.String(),
    updated: Type.String(),
}