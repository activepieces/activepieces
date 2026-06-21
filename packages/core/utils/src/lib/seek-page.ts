import * as z from 'zod/mini'
import { Nullable } from './base-model'

export type Cursor = string | null

export type SeekPage<T> = {
    next: Cursor
    previous: Cursor
    data: T[]
}

export const SeekPage = (t: z.ZodMiniType): z.ZodMiniType => z.object({
    data: z.array(t),
    next: Nullable(z.string()),
    previous: Nullable(z.string()),
})
