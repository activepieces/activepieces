import { z } from 'zod'
import { Nullable } from './base-model'

export type Cursor = string | null

export type SeekPage<T> = {
    next: Cursor
    previous: Cursor
    data: T[]
}

export const SeekPage = (t: z.ZodType): z.ZodType => z.object({
    data: z.array(t),
    next: Nullable(z.string()),
    previous: Nullable(z.string()),
})
