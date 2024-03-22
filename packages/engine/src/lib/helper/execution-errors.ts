export class ExecutionError extends Error {
    constructor(name: string, message: string, public cause?: unknown) {
        super(message)
        this.name = name
    }
}

export class EngineError extends ExecutionError {}

export class UserError extends ExecutionError {}

export class ConnectionNotFoundError extends UserError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionNotFound', `connection (${connectionName}) not found`, cause)
    }
}

export class ConnectionLoadingError extends EngineError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionLoadingFailure', `Failed to load connection (${connectionName})`, cause)
    }
}

export class ConnectionExpiredError extends UserError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionExpired', `connection (${connectionName}) expired, reconnect again`, cause)
    }
}

export class StorageError extends EngineError {
    constructor(key: string, cause?: unknown) {
        super('StorageError', `Failed to read/write key (${key})`, cause)
    }
}

export class FetchError extends EngineError {
    constructor(url: string, cause?: unknown) {
        super('FetchError', `Failed to fetch from ${url}`, cause)
    }
}
