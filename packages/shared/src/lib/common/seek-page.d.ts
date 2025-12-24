import { TSchema } from '@sinclair/typebox';
export type Cursor = string | null;
export type SeekPage<T> = {
    next: Cursor;
    previous: Cursor;
    data: T[];
};
export declare const SeekPage: (t: TSchema) => TSchema;
