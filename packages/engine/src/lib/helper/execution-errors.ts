import { STORE_KEY_MAX_LENGTH } from '@activepieces/shared'

export enum ExecutionErrorType {
    ENGINE = 'ENGINE',
    USER = 'USER',
}
export class ExecutionError extends Error {

    public type: ExecutionErrorType

    constructor(name: string, message: string, type: ExecutionErrorType, public cause?: unknown) {
        super(message)
        this.name = name
        this.type = type
    }
}

function formatMessage(message: string) {
    return JSON.stringify({
        message,
    }, null, 2)
}

export class ConnectionNotFoundError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionNotFound', formatMessage(`connection (${connectionName}) not found`), ExecutionErrorType.USER, cause)
    }
}

export class ConnectionLoadingError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionLoadingFailure', formatMessage(`Failed to load connection (${connectionName})`), ExecutionErrorType.ENGINE, cause)
    }
}

export class ConnectionExpiredError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown) {
        super('ConnectionExpired', formatMessage(`connection (${connectionName}) expired, reconnect again`), ExecutionErrorType.USER, cause)
    }
}

export class StorageLimitError extends ExecutionError {

    public maxStorageSizeInBytes: number

    constructor(key: string, maxStorageSizeInBytes: number, cause?: unknown) {
        super('StorageLimitError', formatMessage(`Failed to read/write key "${key}", the storage value is larger than ${Math.floor(maxStorageSizeInBytes)} MB`), ExecutionErrorType.USER, cause)
        this.maxStorageSizeInBytes = maxStorageSizeInBytes
    }
}

export class StorageInvalidKeyError extends ExecutionError {
    constructor(key: string, cause?: unknown) {
        super('StorageInvalidKeyError', formatMessage(`Failed to read/write key "${key}", the key is empty or longer than ${STORE_KEY_MAX_LENGTH} characters`), ExecutionErrorType.USER, cause)
    }
}

export class StorageError extends ExecutionError {
    constructor(key: string, cause?: unknown) {
        super('StorageError', formatMessage(`Failed to read/write key "${key}" due to ${JSON.stringify(cause)}`), ExecutionErrorType.ENGINE, cause)
    }
}

export class FileStoreError extends ExecutionError {
    constructor(cause?: unknown) {
        super('FileStoreError', formatMessage(`Failed to store file due to ${JSON.stringify(cause)}`), ExecutionErrorType.ENGINE, cause)
    }
}

export class PausedFlowTimeoutError extends ExecutionError {
    constructor(cause?: unknown, maximumPauseDurationDays?: number) {
        super('PausedFlowTimeoutError', `The flow cannot be paused for more than ${maximumPauseDurationDays} days`, ExecutionErrorType.USER, cause)
    }
}

export class ProgressUpdateError extends ExecutionError {
    constructor(message: string, cause?: unknown) {
        super('ProgressUpdateError', JSON.stringify({
            message,
        }, null, 2), ExecutionErrorType.ENGINE, cause)
    }
}

export class FileSizeError extends ExecutionError {
    constructor(currentFileSize: number, maximumSupportSize: number, cause?: unknown) {
        super('FileSizeError', JSON.stringify({
            message: 'File size is larger than maximum supported size',
            currentFileSize: `${currentFileSize} MB`,
            maximumSupportSize: `${maximumSupportSize} MB`,
        }), ExecutionErrorType.USER, cause)
    }
}

export class FetchError extends ExecutionError {
    constructor(url: string, cause?: unknown) {
        super('FetchError', formatMessage(`Failed to fetch from ${url}`), ExecutionErrorType.ENGINE, cause)
    }
}
