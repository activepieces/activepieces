export declare enum ExecutionErrorType {
    ENGINE = "ENGINE",
    USER = "USER"
}
export declare class ExecutionError extends Error {
    cause?: unknown;
    type: ExecutionErrorType;
    constructor(name: string, message: string, type: ExecutionErrorType, cause?: unknown);
}
export declare class ConnectionNotFoundError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown);
}
export declare class ConnectionLoadingError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown);
}
export declare class ConnectionExpiredError extends ExecutionError {
    constructor(connectionName: string, cause?: unknown);
}
export declare class StorageLimitError extends ExecutionError {
    maxStorageSizeInBytes: number;
    constructor(key: string, maxStorageSizeInBytes: number, cause?: unknown);
}
export declare class StorageInvalidKeyError extends ExecutionError {
    constructor(key: string, cause?: unknown);
}
export declare class StorageError extends ExecutionError {
    constructor(key: string, cause?: unknown);
}
export declare class FileStoreError extends ExecutionError {
    constructor(cause?: unknown);
}
export declare class PausedFlowTimeoutError extends ExecutionError {
    constructor(cause?: unknown, maximumPauseDurationDays?: number);
}
export declare class FileSizeError extends ExecutionError {
    constructor(currentFileSize: number, maximumSupportSize: number, cause?: unknown);
}
export declare class FetchError extends ExecutionError {
    constructor(url: string, cause?: unknown);
}
export declare class InvalidCronExpressionError extends ExecutionError {
    constructor(cronExpression: string, cause?: unknown);
}
export declare class EngineGenericError extends ExecutionError {
    constructor(name: string, message: string, cause?: unknown);
}
