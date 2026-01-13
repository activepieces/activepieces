import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
export enum NoteColorVariant {
    ORANGE = 'orange',
    RED = 'red',
    GREEN = 'green',
    BLUE = 'blue',
    PURPLE = 'purple',
    YELLOW = 'yellow',
}
export const Note = Type.Object({
    id: Type.String(),
    content: Type.String(),
    ownerId: Nullable(Type.String()),
    color: Type.Enum(NoteColorVariant),
    position: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
    }),
    size: Type.Object({
        width: Type.Number(),
        height: Type.Number(),
    }),
    createdAt: Type.String(),
    updatedAt: Type.String(),
})
export type Note = Static<typeof Note>