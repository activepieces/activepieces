// Types for the result object with discriminated union
type Success<T> = {
    data: T
    error: null
}
  
type Failure<E> = {
    data: null
    error: E
}
  
export type Result<T, E = Error> = Success<T> | Failure<E>
  
// Main wrapper function
export async function tryCatch<T, E = Error>(
    fn: () => Promise<T>,
): Promise<Result<T, E>> {
    try {
        const data = await fn()
        return { data, error: null }
    }
    catch (error) {
        return { data: null, error: error as E }
    }
}

export function tryCatchSync<T, E = Error>(
    fn: () => T,
): Result<T, E> {
    try {
        const data = fn()
        return { data, error: null }
    }
    catch (error) {
        return { data: null, error: error as E }
    }
}