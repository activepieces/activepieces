export class ActivepiecesError extends Error {

    constructor(public error: StepNotFoundErrorParams | ComponentNotFoundErrorParams | ConfigNotFoundErrorParams) {
        super(error.code);
    }

}

export interface ErrorParams<T, V> {
    code: T,
    params: V
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
    CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
}