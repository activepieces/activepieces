import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
} from '@activepieces/pieces-framework'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, BeginExecuteFlowOperation, EngineResponseStatus, ErrorCode, ExecuteActionResponse, ExecuteExtractPieceMetadata, ExecutePropsOptions, ExecuteStepOperation, ExecuteTriggerOperation, ExecuteTriggerResponse, ExecuteValidateAuthOperation, ExecuteValidateAuthResponse, FlowRunResponse, FlowVersionState, ResumeExecuteFlowOperation, SourceCode, TriggerHookType } from '@activepieces/shared'
import chalk from 'chalk'

type EngineConstants = 'serverUrl' | 'engineToken'

export type CodeArtifact = {
    name: string
    sourceCode: SourceCode
    flowVersionId: string
    flowVersionState: FlowVersionState
}


export type EngineHelperFlowResult = Pick<FlowRunResponse, 'status' | 'error'>

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult =
    | DropdownState<unknown>
    | Record<string, DynamicPropsValue>

export type EngineHelperActionResult = ExecuteActionResponse

export type EngineHelperValidateAuthResult = ExecuteValidateAuthResponse

export type EngineHelperCodeResult = ExecuteActionResponse
export type EngineHelperExtractPieceInformation = PieceMetadata

export type EngineHelperResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | EngineHelperCodeResult
    | EngineHelperExtractPieceInformation
    | EngineHelperActionResult
    | EngineHelperValidateAuthResult

export type EngineHelperResponse<Result extends EngineHelperResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
}


export type ExecuteSandboxResult = {
    output: unknown
    timeInSeconds: number
    verdict: EngineResponseStatus
    standardOutput: string
    standardError: string
}

export type EngineRunner = {
    executeFlow(
        engineToken: string,
        operation:
        | Omit<BeginExecuteFlowOperation, EngineConstants>
        | Omit<ResumeExecuteFlowOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperFlowResult>>
    executeTrigger<T extends TriggerHookType>(
        engineToken: string,
        operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>>
    extractPieceMetadata(
        operation: ExecuteExtractPieceMetadata,
    ): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>>
    executeValidateAuth(
        engineToken: string,
        operation: Omit<ExecuteValidateAuthOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperValidateAuthResult>>
    executeAction(
        engineToken: string,
        operation: Omit<ExecuteStepOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperActionResult>>
    executeProp(
        engineToken: string,
        operation: Omit<ExecutePropsOptions, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperPropResult>>
}

export const engineRunnerUtils = {
    async readResults<Result extends EngineHelperResult>(sandboxResponse: ExecuteSandboxResult): Promise<EngineHelperResponse<Result>> {


        sandboxResponse.standardOutput.split('\n').forEach((f) => {
            if (f.trim().length > 0) logger.debug({}, chalk.yellow(f))
        })

        sandboxResponse.standardError.split('\n').forEach((f) => {
            if (f.trim().length > 0) logger.debug({}, chalk.red(f))
        })

        if (sandboxResponse.verdict === EngineResponseStatus.TIMEOUT) {
            throw new ActivepiecesError({
                code: ErrorCode.EXECUTION_TIMEOUT,
                params: {},
            })
        }

        const result = tryParseJson(sandboxResponse.output) as EngineHelperFlowResult

        const response = {
            status: sandboxResponse.verdict,
            result: result as Result,
            standardError: sandboxResponse.standardError,
            standardOutput: sandboxResponse.standardOutput,
        }

        logger.trace(response, '[EngineHelper#response] response')

        return response
    },
}



function tryParseJson(value: unknown): unknown {
    try {
        return JSON.parse(value as string)
    }
    catch (e) {
        return value
    }
}
