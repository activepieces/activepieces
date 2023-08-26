import { TSchema, Type } from "@sinclair/typebox";

export type Cursor = string | null;

export interface SeekPage<T> {
    next: Cursor;
    previous: Cursor;
    data: T[];
}

export const SeekPage = (t: TSchema) => Type.Object({
    data: Type.Array(t),
    next: Type.Union([Type.Null(), Type.String()]),
    previous: Type.Union([Type.Null(), Type.String()]),
})
