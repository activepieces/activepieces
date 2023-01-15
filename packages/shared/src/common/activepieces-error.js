"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.ActivepiecesError = void 0;
class ActivepiecesError extends Error {
    constructor(error) {
        super(error.code);
        this.error = error;
    }
}
exports.ActivepiecesError = ActivepiecesError;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["COLLECTION_NOT_FOUND"] = "COLLECTION_NOT_FOUND";
    ErrorCode["COLLECTION_VERSION_NOT_FOUND"] = "COLLECTION_VERSION_NOT_FOUND";
    ErrorCode["CONFIG_NOT_FOUND"] = "CONFIG_NOT_FOUND";
    ErrorCode["EXISTING_USER"] = "EXISTING_USER";
    ErrorCode["APP_CREDENTIAL_NOT_FOUND"] = "APP_CREDENTIAL_NOT_FOUND";
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FLOW_NOT_FOUND"] = "FLOW_NOT_FOUND";
    ErrorCode["FLOW_RUN_NOT_FOUND"] = "INSTANCE_NOT_FOUND";
    ErrorCode["FLOW_VERSION_NOT_FOUND"] = "FLOW_VERSION_NOT_FOUND";
    ErrorCode["INSTANCE_NOT_FOUND"] = "INSTANCE_NOT_FOUND";
    ErrorCode["INVALID_BEARER_TOKEN"] = "INVALID_BEARER_TOKEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["JOB_REMOVAL_FAILURE"] = "JOB_REMOVAL_FAILURE";
    ErrorCode["PIECE_NOT_FOUND"] = "PIECE_NOT_FOUND";
    ErrorCode["PIECE_TRIGGER_NOT_FOUND"] = "PIECE_TRIGGER_NOT_FOUND";
    ErrorCode["STEP_NOT_FOUND"] = "STEP_NOT_FOUND";
    ErrorCode["SYSTEM_PROP_NOT_DEFINED"] = "SYSTEM_PROP_NOT_DEFINED";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
