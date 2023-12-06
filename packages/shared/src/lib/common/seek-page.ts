import { TSchema, Type } from '@sinclair/typebox'
import { Nullable } from './base-model'

export type Cursor = string | null

export type SeekPage<T> = {
    next: Cursor
    previous: Cursor
    data: T[]
}

export const SeekPage = (t: TSchema): TSchema => Type.Object({
    data: Type.Array(t),
    next: Nullable(Type.String({ description: 'Cursor to the next page' })),
    previous: Nullable(Type.String({ description: 'Cursor to the previous page' })),
})
