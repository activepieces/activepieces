export type Cursor = string;

export interface SeekPage<T> {
    next: Cursor;
    previous: Cursor;
    data: T[];
}