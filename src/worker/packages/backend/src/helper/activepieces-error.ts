import {CollectionId, FileId, FlowId} from "shared";

export class ActivepiecesError extends Error {

    constructor(public error: StepNotFoundErrorParams | ComponentNotFoundErrorParams | ConfigNotFoundErrorParams
        | InvalidBearerTokenParams | ExistingUserErrorParams | InvalidCredentialsErrorParams | CollectionNotFoundErrorParams | FlowNotFoundErrorParams | FileNotFoundErrorParams) {
        super(error.code);
    }

}

export interface ErrorParams<T, V> {
    code: T,
    params: V
}

export interface InvalidBearerTokenParams extends
    ErrorParams<ErrorCode.INVALID_BEARER_TOKEN, {}> {
}

export interface FileNotFoundErrorParams extends ErrorParams<ErrorCode.FILE_NOT_FOUND, {
    id: FileId
}> {
}

export interface FlowNotFoundErrorParams extends ErrorParams<ErrorCode.FLOW_NOT_FOUND, {
    id: FlowId
}> {
}

export interface CollectionNotFoundErrorParams extends ErrorParams<ErrorCode.COLLECTION_NOT_FOUND, {
    id: CollectionId
}> {
}

export interface InvalidCredentialsErrorParams extends ErrorParams<ErrorCode.INVALID_CREDENTIALS, {
    email: string
}> {
}

export interface ExistingUserErrorParams extends ErrorParams<ErrorCode.EXISTING_USER, {
}> {
}

export interface ComponentNotFoundErrorParams extends ErrorParams<ErrorCode.PIECE_NOT_FOUND, {
    pieceName: string
}> {
}

export interface StepNotFoundErrorParams extends ErrorParams<ErrorCode.STEP_NOT_FOUND, {
    pieceName: string,
    stepName: string
}> {
}

export interface ConfigNotFoundErrorParams extends ErrorParams<ErrorCode.CONFIG_NOT_FOUND, {
    pieceName: string,
    stepName: string,
    configName: string
}> {}


export enum ErrorCode {
    INVALID_BEARER_TOKEN = "INVALID_BEARER_TOKEN",
    PIECE_NOT_FOUND = "PIECE_NOT_FOUND",
    STEP_NOT_FOUND = "STEP_NOT_FOUND",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FLOW_NOT_FOUND = "FLOW_NOT_FOUND",
    COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
    EXISTING_USER = "EXISTING_USER",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
}