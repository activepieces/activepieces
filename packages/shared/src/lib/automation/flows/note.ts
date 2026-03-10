import { z } from 'zod'
import { Nullable } from '../../core/common'
export enum NoteColorVariant {
    ORANGE = 'orange',
    RED = 'red',
    GREEN = 'green',
    BLUE = 'blue',
    PURPLE = 'purple',
    YELLOW = 'yellow',
}
export const Note = z.object({
    id: z.string(),
    content: z.string(),
    ownerId: Nullable(z.string()),
    color: z.nativeEnum(NoteColorVariant),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    size: z.object({
        width: z.number(),
        height: z.number(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type Note = z.infer<typeof Note>
