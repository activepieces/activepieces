import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
    PropertyType,
} from '@activepieces/pieces-framework'
import { EngineResponseStatus, ExecuteActionResponse, ExecuteToolResponse, ExecuteTriggerResponse, ExecuteValidateAuthResponse, FlowVersionState, SourceCode, TriggerHookType } from '@activepieces/shared'

export type CodeArtifact = {
    name: string
    sourceCode: SourceCode
    flowVersionId: string
    flowVersionState: FlowVersionState
}


export type EngineHelperFlowResult = Record<string, never>

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult = {
    type: PropertyType.DROPDOWN
    options: DropdownState<unknown>
} | {
    type: PropertyType.DYNAMIC
    options: Record<string, DynamicPropsValue>
}

export type EngineHelperActionResult = ExecuteActionResponse

export type EngineHelperToolResult = ExecuteToolResponse

export type EngineHelperValidateAuthResult = ExecuteValidateAuthResponse

export type EngineHelperCodeResult = ExecuteActionResponse
export type EngineHelperExtractPieceInformation = PieceMetadata

export type EngineHelperResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | EngineHelperToolResult
    | EngineHelperCodeResult
    | EngineHelperExtractPieceInformation
    | EngineHelperActionResult
    | EngineHelperValidateAuthResult

export type EngineHelperResponse<Result extends EngineHelperResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
    delayInSeconds?: number
}


export type ExecuteSandboxResult = {
    output: unknown
    timeInSeconds: number
    verdict: EngineResponseStatus
    standardOutput: string
    standardError: string
}
