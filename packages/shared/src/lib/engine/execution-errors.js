"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineGenericError = exports.InvalidCronExpressionError = exports.FetchError = exports.FileSizeError = exports.PausedFlowTimeoutError = exports.FileStoreError = exports.StorageError = exports.StorageInvalidKeyError = exports.StorageLimitError = exports.ConnectionExpiredError = exports.ConnectionLoadingError = exports.ConnectionNotFoundError = exports.ExecutionError = exports.ExecutionErrorType = void 0;
const store_entry_1 = require("../store-entry/store-entry");
var ExecutionErrorType;
(function (ExecutionErrorType) {
    ExecutionErrorType["ENGINE"] = "ENGINE";
    ExecutionErrorType["USER"] = "USER";
})(ExecutionErrorType || (exports.ExecutionErrorType = ExecutionErrorType = {}));
class ExecutionError extends Error {
    constructor(name, message, type, cause) {
        super(message);
        this.cause = cause;
        this.name = name;
        this.type = type;
    }
}
exports.ExecutionError = ExecutionError;
function formatMessage(message) {
    return JSON.stringify({
        message,
    }, null, 2);
}
class ConnectionNotFoundError extends ExecutionError {
    constructor(connectionName, cause) {
        super('ConnectionNotFound', formatMessage(`connection (${connectionName}) not found`), ExecutionErrorType.USER, cause);
    }
}
exports.ConnectionNotFoundError = ConnectionNotFoundError;
class ConnectionLoadingError extends ExecutionError {
    constructor(connectionName, cause) {
        super('ConnectionLoadingFailure', formatMessage(`Failed to load connection (${connectionName})`), ExecutionErrorType.ENGINE, cause);
    }
}
exports.ConnectionLoadingError = ConnectionLoadingError;
class ConnectionExpiredError extends ExecutionError {
    constructor(connectionName, cause) {
        super('ConnectionExpired', formatMessage(`connection (${connectionName}) expired, reconnect again`), ExecutionErrorType.USER, cause);
    }
}
exports.ConnectionExpiredError = ConnectionExpiredError;
class StorageLimitError extends ExecutionError {
    constructor(key, maxStorageSizeInBytes, cause) {
        super('StorageLimitError', formatMessage(`Failed to read/write key "${key}", the value you are trying to read/write is larger than ${Math.floor(maxStorageSizeInBytes / 1024)} KB`), ExecutionErrorType.USER, cause);
        this.maxStorageSizeInBytes = maxStorageSizeInBytes;
    }
}
exports.StorageLimitError = StorageLimitError;
class StorageInvalidKeyError extends ExecutionError {
    constructor(key, cause) {
        super('StorageInvalidKeyError', formatMessage(`Failed to read/write key "${key}", the key is empty or longer than ${store_entry_1.STORE_KEY_MAX_LENGTH} characters`), ExecutionErrorType.USER, cause);
    }
}
exports.StorageInvalidKeyError = StorageInvalidKeyError;
class StorageError extends ExecutionError {
    constructor(key, cause) {
        super('StorageError', formatMessage(`Failed to read/write key "${key}" due to ${JSON.stringify(cause)}`), ExecutionErrorType.ENGINE, cause);
    }
}
exports.StorageError = StorageError;
class FileStoreError extends ExecutionError {
    constructor(cause) {
        super('FileStoreError', formatMessage(`Failed to store file due to ${JSON.stringify(cause)}`), ExecutionErrorType.ENGINE, cause);
    }
}
exports.FileStoreError = FileStoreError;
class PausedFlowTimeoutError extends ExecutionError {
    constructor(cause, maximumPauseDurationDays) {
        super('PausedFlowTimeoutError', `The flow cannot be paused for more than ${maximumPauseDurationDays} days`, ExecutionErrorType.USER, cause);
    }
}
exports.PausedFlowTimeoutError = PausedFlowTimeoutError;
class FileSizeError extends ExecutionError {
    constructor(currentFileSize, maximumSupportSize, cause) {
        super('FileSizeError', JSON.stringify({
            message: 'File size is larger than maximum supported size',
            currentFileSize: `${currentFileSize} MB`,
            maximumSupportSize: `${maximumSupportSize} MB`,
        }), ExecutionErrorType.USER, cause);
    }
}
exports.FileSizeError = FileSizeError;
class FetchError extends ExecutionError {
    constructor(url, cause) {
        super('FetchError', formatMessage(`Failed to fetch from ${url}`), ExecutionErrorType.ENGINE, cause);
    }
}
exports.FetchError = FetchError;
class InvalidCronExpressionError extends ExecutionError {
    constructor(cronExpression, cause) {
        super('InvalidCronExpressionError', formatMessage(`Invalid cron expression: ${cronExpression}`), ExecutionErrorType.USER, cause);
    }
}
exports.InvalidCronExpressionError = InvalidCronExpressionError;
class EngineGenericError extends ExecutionError {
    constructor(name, message, cause) {
        super(name, formatMessage(message), ExecutionErrorType.ENGINE, cause);
    }
}
exports.EngineGenericError = EngineGenericError;
//# sourceMappingURL=execution-errors.js.map