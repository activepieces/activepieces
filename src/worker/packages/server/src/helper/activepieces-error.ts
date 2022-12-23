import {CollectionId} from "shared";

export class ActivepiecesError extends Error {

    constructor(public error: StepNotFoundErrorParams | ComponentNotFoundErrorParams | ConfigNotFoundErrorParams
        | ExistingUserErrorParams | InvalidCredentialsErrorParams | CollectionNotFoundErrorParams) {
        super(error.code);
    }

}

export interface ErrorParams<T, V> {
    code: T,
    params: V
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

export interface ComponentNotFoundErrorParams extends ErrorParams<ErrorCode.COMPONENT_NOT_FOUND, {
    componentName: string
}> {
}

export interface StepNotFoundErrorParams extends ErrorParams<ErrorCode.STEP_NOT_FOUND, {
    componentName: string,
    stepName: string
}> {
}

export interface ConfigNotFoundErrorParams extends ErrorParams<ErrorCode.CONFIG_NOT_FOUND, {
    componentName: string,
    stepName: string,
    configName: string
}> {}


export enum ErrorCode {
    COMPONENT_NOT_FOUND = "COMPONENT_NOT_FOUND",
    STEP_NOT_FOUND = "STEP_NOT_FOUND",
    COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
    EXISTING_USER = "EXISTING_USER",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
}