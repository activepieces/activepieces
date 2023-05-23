import fs from 'node:fs/promises'
import {
    apId,
    EngineOperation,
    EngineOperationType,
    ExecuteActionOperation,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteTriggerOperation,
    ExecutionOutput,
    PieceTrigger,
    PrincipalType,
    ProjectId,
    TriggerHookType,
    ExecuteTriggerResponse,
    ExecuteActionResponse,
    EngineResponseStatus,
    ActivepiecesError,
    ErrorCode,
} from '@activepieces/shared'
import { Sandbox, sandboxManager } from '../workers/sandbox'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { tokenUtils } from '../authentication/lib/token-utils'
import { DropdownState, DynamicPropsValue } from '@activepieces/pieces-framework'
import { logger } from '../helper/logger'
import chalk from 'chalk'
import { getEdition, getWebhookSecret } from './secret-helper'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { pieceManager } from '../flows/common/piece-installer'

type InstallPieceParams = {
    path: string
    pieceName: string
    pieceVersion: string
}

type GetSandboxParams = {
    pieceName: string
    pieceVersion: string
}

type GenerateWorkerTokenParams = {
    projectId: ProjectId
}

export type EngineHelperFlowResult = ExecutionOutput

export type EngineHelperTriggerResult<T extends TriggerHookType = TriggerHookType> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult = DropdownState<unknown> | Record<string, DynamicPropsValue>

export type EngineHelperActionResult = ExecuteActionResponse

export type EngineHelperResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | EngineHelperActionResult

export type EngineHelperResponse<Result extends EngineHelperResult> = {
    status: EngineResponseStatus
    result: Result
}


const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH)
const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH)


const installPiece = async (params: InstallPieceParams) => {
    logger.debug(params, '[InstallPiece] params')

    const { path, pieceName, pieceVersion } = params

    await pieceManager.install({
        projectPath: path,
        pieces: [
            {
                name: pieceName,
                version: pieceVersion,
            },
        ],
    })
}

const generateWorkerToken = (request: GenerateWorkerTokenParams): Promise<string> => {
    return tokenUtils.encode({
        type: PrincipalType.WORKER,
        id: apId(),
        projectId: request.projectId,
    })
}

const getSandbox = async ({ pieceName, pieceVersion }: GetSandboxParams): Promise<Sandbox> => {
    const sandbox = await sandboxManager.obtainSandbox(`${pieceName}:${pieceVersion}`)

    if (sandbox.cached) {
        logger.info(`Reusing sandbox number ${sandbox.boxId} for ${pieceName}:${pieceVersion}`)
        await sandbox.clean()
    }
    else {
        logger.info(`Preparing sandbox number ${sandbox.boxId} for ${pieceName}:${pieceVersion}`)
        await sandbox.recreate()
        const path = sandbox.getSandboxFolderPath()

        await installPiece({
            path,
            pieceName,
            pieceVersion,
        })
    }

    return sandbox
}

const execute = async <Result extends EngineHelperResult>(
    operation: EngineOperationType,
    sandbox: Sandbox,
    input: EngineOperation,
): Promise<EngineHelperResponse<Result>> => {
    logger.info(`Executing ${operation} inside sandbox number ${sandbox.boxId}`)

    const sandboxPath = sandbox.getSandboxFolderPath()

    await fs.copyFile(engineExecutablePath, `${sandboxPath}/activepieces-engine.js`)

    await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify({
        ...input,
        apiUrl: 'http://127.0.0.1:3000',
    }))

    const sandboxResponse = await sandbox.runCommandLine(`${nodeExecutablePath} activepieces-engine.js ${operation}`)

    sandboxResponse.standardOutput.split('\n').forEach(f => {
        if (f.trim().length > 0) logger.info({}, chalk.yellow(f))
    })

    sandboxResponse.standardError.split('\n').forEach(f => {
        if (f.trim().length > 0) logger.error({}, chalk.red(f))
    })

    if(sandboxResponse.verdict === EngineResponseStatus.TIMEOUT){
        throw new ActivepiecesError({
            code: ErrorCode.EXECUTION_TIMEOUT,
            params: {},
        })
    }

    const result: Result = typeof sandboxResponse.output === 'string'
        ? JSON.parse(sandboxResponse.output)
        : sandboxResponse.output

    const response = {
        status: sandboxResponse.verdict,
        result,
    }

    logger.trace(response, '[EngineHelper#response] response')

    return response
}


export const engineHelper = {
    async executeFlow(
        sandbox: Sandbox,
        operation: ExecuteFlowOperation,
    ): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.info({ ...operation, triggerPayload: undefined, executionState: undefined }, '[EngineHelper#executeFlow] operation')

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        return await execute(
            EngineOperationType.EXECUTE_FLOW,
            sandbox,
            input,
        )
    },

    async executeTrigger<T extends TriggerHookType>(
        operation: ExecuteTriggerOperation<T>,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>> {
        const { pieceName, pieceVersion } = (operation.flowVersion.trigger as PieceTrigger).settings

        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        const input ={
            ...operation,
            edition: await getEdition(),
            appWebhookUrl: await appEventRoutingService.getAppWebhookUrl({ appName: pieceName }),
            webhookSecret: await getWebhookSecret(operation.flowVersion),
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        try {
            return await execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                sandbox,
                input,
            )
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeProp(
        operation: ExecutePropsOptions,
    ): Promise<EngineHelperResponse<EngineHelperPropResult>> {
        logger.debug(operation, '[EngineHelper#executeProp] operation')

        const { pieceName, pieceVersion } = operation

        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        try {
            return await execute(
                EngineOperationType.EXECUTE_PROPERTY,
                sandbox,
                input,
            )
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeAction(operation: ExecuteActionOperation): Promise<EngineHelperResponse<EngineHelperActionResult>> {
        logger.debug(operation, '[EngineHelper#executeAction] operation')

        const { pieceName, pieceVersion } = operation

        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        try {
            return await execute(
                EngineOperationType.EXECUTE_ACTION,
                sandbox,
                input,
            )
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },
}
