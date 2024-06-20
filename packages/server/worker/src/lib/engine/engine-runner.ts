import { ActivepiecesError, BeginExecuteFlowOperation, EngineOperation, EngineOperationType, EngineResponseStatus, ErrorCode, ExecuteActionResponse, ExecuteFlowOperation, ExecuteTriggerResponse, ExecuteValidateAuthResponse, FlowRunResponse, ResumeExecuteFlowOperation, TriggerHookType } from "@activepieces/shared"
import { Sandbox } from "../sandbox"
import { logger, networkUtls,} from "@activepieces/server-shared"
import fs from 'node:fs/promises'
import chalk from 'chalk'
import { sandboxProvisioner } from "../sandbox/provisioner/sandbox-provisioner"
import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
} from '@activepieces/pieces-framework'

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

const execute = async <Result extends EngineHelperResult>(
    operationType: EngineOperationType,
    sandbox: Sandbox,
    input: EngineOperation,
): Promise<EngineHelperResponse<Result>> => {
    try {
        logger.debug(
            { operationType, sandboxId: sandbox.boxId },
            '[EngineHelper#execute]',
        )

        const sandboxPath = sandbox.getSandboxFolderPath()

        await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify(input))
        const sandboxResponse = await sandbox.runOperation(operationType, input)

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

        const result = tryParseJson(sandboxResponse.output) as Result

        const response = {
            status: sandboxResponse.verdict,
            result,
            standardError: sandboxResponse.standardError,
            standardOutput: sandboxResponse.standardOutput,
        }

        logger.trace(response, '[EngineHelper#response] response')

        return response
    }
    finally {
        await sandboxProvisioner.release({ sandbox })
    }
}

function tryParseJson(value: unknown): unknown {
    try {
        return JSON.parse(value as string)
    }
    catch (e) {
        return value
    }
}

type EngineConstants = 'serverUrl' | 'engineToken'


export const engineRunner = {
    execute,
    async executeFlow(
        engineToken: string,
        sandbox: Sandbox,
        operation:
        | Omit<BeginExecuteFlowOperation, EngineConstants>
        | Omit<ResumeExecuteFlowOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.debug(
            {
                executionType: operation.executionType,
                flowRunId: operation.flowRunId,
                projectId: operation.projectId,
                sandboxId: sandbox.boxId,
            },
            '[EngineHelper#executeFlow]',
        )
        const input: ExecuteFlowOperation = {
            ...operation,
            engineToken,
            serverUrl: await networkUtls.getApiUrl(),
        }
        return execute(EngineOperationType.EXECUTE_FLOW, sandbox, input)
    },
}
