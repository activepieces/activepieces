import {CollectionId, FileId, FlowId, InstanceId, InstanceRunId} from "shared";

export class ActivepiecesError extends Error {

    constructor(public error: ErrorParams) {
        super(error.code);
    }

}

type ErrorParams =
    | CollectionNotFoundErrorParams
    | PieceNotFoundErrorParams
    | ConfigNotFoundErrorParams
    | ExistingUserErrorParams
    | FileNotFoundErrorParams
    | FlowNotFoundErrorParams
    | InstanceNotFoundErrorParams
    | InstanceRunNotFoundErrorParams
    | InvalidBearerTokenParams
    | InvalidCredentialsErrorParams
    | StepNotFoundErrorParams;

export interface BaseErrorParams<T, V> {
    code: T,
    params: V
}

export interface InvalidBearerTokenParams extends BaseErrorParams<ErrorCode.INVALID_BEARER_TOKEN, {}> {}

export interface FileNotFoundErrorParams extends BaseErrorParams<ErrorCode.FILE_NOT_FOUND, { id: FileId }> {
}

export interface FlowNotFoundErrorParams extends BaseErrorParams<ErrorCode.FLOW_NOT_FOUND, {
    id: FlowId
}> {
}

export interface CollectionNotFoundErrorParams extends BaseErrorParams<ErrorCode.COLLECTION_NOT_FOUND, {
    id: CollectionId
}> {
}

export interface InstanceNotFoundErrorParams extends BaseErrorParams<ErrorCode.INSTANCE_NOT_FOUND, {
    id: InstanceId
}> {
}

export interface InstanceRunNotFoundErrorParams extends BaseErrorParams<ErrorCode.INSTANCE_NOT_FOUND, {
    id: InstanceRunId
}> {
}

export interface InvalidCredentialsErrorParams extends BaseErrorParams<ErrorCode.INVALID_CREDENTIALS, {
    email: string
}> {
}

export interface ExistingUserErrorParams extends BaseErrorParams<ErrorCode.EXISTING_USER, {}> {
}


export interface StepNotFoundErrorParams extends BaseErrorParams<ErrorCode.STEP_NOT_FOUND, {
    pieceName: string,
    stepName: string
}> {
}

export interface PieceNotFoundErrorParams extends BaseErrorParams<ErrorCode.PIECE_NOT_FOUND, {
    pieceName: string
}> {
}


export interface ConfigNotFoundErrorParams extends BaseErrorParams<ErrorCode.CONFIG_NOT_FOUND, {
    pieceName: string,
    stepName: string,
    configName: string
}> {
}


export enum ErrorCode {
    INVALID_BEARER_TOKEN = "INVALID_BEARER_TOKEN",
    PIECE_NOT_FOUND = "PIECE_NOT_FOUND",
    COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
    COMPONENT_NOT_FOUND = "COMPONENT_NOT_FOUND",
    CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
    EXISTING_USER = "EXISTING_USER",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FLOW_NOT_FOUND = "FLOW_NOT_FOUND",
    INSTANCE_NOT_FOUND = "INSTANCE_NOT_FOUND",
    INSTANCE_RUN_NOT_FOUND = "INSTANCE_NOT_FOUND",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    STEP_NOT_FOUND = "STEP_NOT_FOUND",
}