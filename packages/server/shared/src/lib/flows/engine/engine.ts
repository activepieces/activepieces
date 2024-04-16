import fs from 'node:fs/promises'
import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
} from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    BeginExecuteFlowOperation,
    EngineOperation,
    EngineOperationType,
    EngineResponseStatus,
    ErrorCode,
    ExecuteActionResponse,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecuteValidateAuthResponse,
    FlowRunResponse,
    ResumeExecuteFlowOperation,
    TriggerHookType,
} from '@activepieces/shared'
import chalk from 'chalk'
import { getServerUrl } from '../../core'
import { logger } from '../../logger'
import { Sandbox } from '../sandbox/core'
import { sandboxProvisioner } from '../sandbox/provisioning/sandbox-provisioner'

export const engine = {
    async execute<Result extends EngineHelperResult>({ operation, sandbox, input }: ExecuteParams): Promise<EngineHelperResponse<Result>> {
        logger.debug({ name: 'Engine#Execute', operation, sandboxId: sandbox.boxId })

        try {
            const sandboxPath = sandbox.getSandboxFolderPath()

            await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify(input))
            const sandboxResponse = await sandbox.runOperation(operation)

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

            logger.trace({ name: 'Engine#execute', response })

            return response
        }
        finally {
            await sandboxProvisioner.release({ sandbox })
        }
    },

    async executeFlow({ operation, sandbox, accessToken }: ExecuteFlowParams): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.debug({
            name: 'Engine#executeFlow',
            executionType: operation.executionType,
            flowRunId: operation.flowRunId,
            projectId: operation.projectId,
            sandboxId: sandbox.boxId,
        })

        const input: ExecuteFlowOperation = {
            ...operation,
            workerToken: accessToken,
            serverUrl: await getServerUrl(),
        }

        return this.execute({
            operation: EngineOperationType.EXECUTE_FLOW,
            sandbox,
            input,
        })
    },
}

const tryParseJson = (value: unknown): unknown => {
    try {
        return JSON.parse(value as string)
    }
    catch (e) {
        return value
    }
}

type EngineHelperFlowResult = FlowRunResponse

type EngineHelperTriggerResult<T extends TriggerHookType = TriggerHookType> = ExecuteTriggerResponse<T>

type EngineHelperPropResult =
    | DropdownState<unknown>
    | Record<string, DynamicPropsValue>

type EngineHelperActionResult = ExecuteActionResponse

type EngineHelperValidateAuthResult = ExecuteValidateAuthResponse

type EngineHelperCodeResult = ExecuteActionResponse
type EngineHelperExtractPieceInformation = PieceMetadata

type EngineHelperResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | EngineHelperCodeResult
    | EngineHelperExtractPieceInformation
    | EngineHelperActionResult
    | EngineHelperValidateAuthResult

type EngineHelperResponse<Result extends EngineHelperResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
}

type ExecuteParams = {
    operation: EngineOperationType
    sandbox: Sandbox
    input: EngineOperation
}

type ExecuteFlowParams = {
    sandbox: Sandbox
    operation: Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>
    accessToken: string
}

type EngineConstants = 'serverUrl' | 'workerToken'
