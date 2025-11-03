import { ExecutionError, ExecutionErrorType } from './execution-errors'

type Success<T> = {
    data: T
    error: null
}
  
  type Failure<E> = {
      data: null
      error: E
  }
  
  type Result<T, E = Error> = Success<T> | Failure<E>
  
export async function tryCatchAndThrowEngineError<T, E = Error>(
    promise: Promise<T>,
): Promise<Result<T, E>> {
    try {
        const data = await promise
        return { data, error: null }
    }
    catch (error) {
        if (error instanceof ExecutionError && error.type === ExecutionErrorType.ENGINE) {
            throw error
        }
        return { data: null, error: error as E }
    }
}