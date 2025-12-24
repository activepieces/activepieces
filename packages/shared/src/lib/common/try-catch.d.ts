type Success<T> = {
    data: T;
    error: null;
};
type Failure<E> = {
    data: null;
    error: E;
};
export type Result<T, E = Error> = Success<T> | Failure<E>;
export declare function tryCatch<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>>;
export declare function tryCatchSync<T, E = Error>(fn: () => T): Result<T, E>;
export {};
