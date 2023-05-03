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

const log = logger.child({ file: 'EngineHelper' })

const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH)
const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH)

const installPiece = async (params: InstallPieceParams) => {
    log.debug(params, '[InstallPiece] params')

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

export const engineHelper = {
    async executeFlow(sandbox: Sandbox, operation: ExecuteFlowOperation): Promise<ExecutionOutput> {
        const result = await execute<ExecutionOutput>(EngineOperationType.EXECUTE_FLOW, sandbox, {
            ...operation,
            workerToken: await workerToken({ projectId: operation.projectId }),
        })
        return result
    },
    async executeTrigger<T extends TriggerHookType>(operation: ExecuteTriggerOperation<T>): Promise<ExecuteTriggerResponse<T>> {
        const { pieceName, pieceVersion } = (operation.flowVersion.trigger as PieceTrigger).settings
        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        try {
            const result = await execute<ExecuteTriggerResponse<T>>(EngineOperationType.EXECUTE_TRIGGER_HOOK, sandbox, {
                ...operation,
                edition: await getEdition(),
                appWebhookUrl: await appEventRoutingService.getAppWebhookUrl({ appName: pieceName }),
                webhookSecret: await getWebhookSecret(operation.flowVersion),
                workerToken: await workerToken({
                    projectId: operation.projectId,
                }),
            })
            return result
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeProp(operation: ExecutePropsOptions): Promise<DropdownState<unknown> | Record<string, DynamicPropsValue>> {
        log.debug(operation, '[EngineHelper#executeProp] operation')

        const { pieceName, pieceVersion } = operation

        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        try {
            const result = await execute<DropdownState<unknown> | Record<string, DynamicPropsValue>>(
                EngineOperationType.EXECUTE_PROPERTY,
                sandbox,
                {
                    ...operation,
                    workerToken: await workerToken({
                        projectId: operation.projectId,
                    }),
                },
            )

            return result
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeAction(operation: ExecuteActionOperation): Promise<ExecuteActionResponse> {
        logger.debug(operation, '[EngineHelper#executeAction] operation')

        const { pieceName, pieceVersion } = operation

        const sandbox = await getSandbox({
            pieceName,
            pieceVersion,
        })

        try {
            const result = await execute<ExecuteActionResponse>(EngineOperationType.EXECUTE_ACTION, sandbox, {
                ...operation,
                workerToken: await workerToken({
                    projectId: operation.projectId,
                }),
            })

            return result
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },
}

function workerToken(request: { projectId: ProjectId }): Promise<string> {
    return tokenUtils.encode({
        type: PrincipalType.WORKER,
        id: apId(),
        projectId: request.projectId,
    })
}

async function getSandbox({ pieceName, pieceVersion }: {
    pieceName: string
    pieceVersion: string
}): Promise<Sandbox> {
    const sandbox = await sandboxManager.obtainSandbox(`${pieceName}:${pieceVersion}`)
    if (sandbox.cached) {
        logger.info(`Resuing sandox number ${sandbox.boxId} for ${pieceName}:${pieceVersion}`)
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

async function execute<T>(operation: EngineOperationType, sandbox: Sandbox, input: EngineOperation): Promise<T> {
    log.info(`Executing ${operation} inside sandbox number ${sandbox.boxId}`)

    const sandboxPath = sandbox.getSandboxFolderPath()

    await fs.copyFile(engineExecutablePath, `${sandboxPath}/activepieces-engine.js`)

    await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify({
        ...input,
        apiUrl: 'http://127.0.0.1:3000',
    }))

    const result = await sandbox.runCommandLine(`${nodeExecutablePath} activepieces-engine.js ${operation}`)

    result.standardOutput.split('\n').forEach(f => {
        if (f.trim().length > 0) log.info({}, chalk.yellow(f))
    })

    result.standardError.split('\n').forEach(f => {
        if (f.trim().length > 0) log.error({}, chalk.red(f))
    })
    if(result.verdict === EngineResponseStatus.TIMEOUT){
        throw new ActivepiecesError({
            code: ErrorCode.EXECUTION_TIMEOUT,
            params: {},
        })
    }

    return result.output as T
}
