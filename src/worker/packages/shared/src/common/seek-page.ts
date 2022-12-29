export type Cursor = string | null;

export interface SeekPage<T> {
    next: Cursor;
    previous: Cursor;
    data: T[];
}