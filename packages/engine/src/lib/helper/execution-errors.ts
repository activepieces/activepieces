export class ExecutionError extends Error {
    constructor(name: string, message: string, public cause?: unknown) {
        super(message)
        this.name = name
    }
}

export class RetryableError extends ExecutionError {}

export class NonRetryableError extends ExecutionError {}

export class ConnectionNotFoundError extends NonRetryableError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionNotFound', `connection (${connectionName}) not found`, cause)
    }
}

export class ConnectionLoadingError extends NonRetryableError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionLoadingFailure', `Failed to load connection (${connectionName})`, cause)
    }
}

export class StorageError extends NonRetryableError {
    constructor(key: string, cause?: unknown) {
        super('StorageError', `Failed to read/write key (${key})`, cause)
    }
}

export class FetchError extends RetryableError {
    constructor(url: string, cause?: unknown) {
        super('FetchError', `Failed to fetch from ${url}`, cause)
    }
}
