import fs from 'node:fs/promises'
import {
    apId,
    CollectionId,
    EngineOperation,
    EngineOperationType,
    ExecuteActionOperation,
    ExecuteEventParserOperation,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteTestOrRunTriggerResponse,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    ExecutionOutput,
    ParseEventResponse,
    PieceTrigger,
    PrincipalType,
    ProjectId,
    TriggerHookType,
} from '@activepieces/shared'
import { Sandbox, sandboxManager } from '../workers/sandbox'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { tokenUtils } from '../authentication/lib/token-utils'
import { DynamicPropsValue } from '@activepieces/pieces-framework'
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
        return await execute(EngineOperationType.EXECUTE_FLOW, sandbox, {
            ...operation,
            workerToken: await workerToken({ collectionId: operation.collectionId, projectId: operation.projectId }),
        }) as ExecutionOutput
    },
    async executeParseEvent(operation: ExecuteEventParserOperation): Promise<ParseEventResponse> {
        const sandbox = sandboxManager.obtainSandbox()
        let result
        try {
            await sandbox.cleanAndInit()

            const path = sandbox.getSandboxFolderPath()
            const { pieceName } = operation

            await installPiece({
                path,
                pieceName,
                pieceVersion: 'latest',
            })

            result = await execute(EngineOperationType.EXTRACT_EVENT_DATA, sandbox, operation)
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId)
        }
        return result as ParseEventResponse
    },

    async executeTrigger(operation: ExecuteTriggerOperation): Promise<void | unknown[] | ExecuteTestOrRunTriggerResponse | ExecuteTriggerResponse> {
        const sandbox = sandboxManager.obtainSandbox()
        let result
        try {
            await sandbox.cleanAndInit()
            const path = sandbox.getSandboxFolderPath()
            const { pieceName, pieceVersion } = (operation.flowVersion.trigger as PieceTrigger).settings

            await installPiece({
                path,
                pieceName,
                pieceVersion,
            })

            result = await execute(EngineOperationType.EXECUTE_TRIGGER_HOOK, sandbox, {
                ...operation,
                edition: await getEdition(),
                appWebhookUrl: await appEventRoutingService.getAppWebhookUrl({ appName: pieceName }),
                webhookSecret: await getWebhookSecret(operation.flowVersion),
                workerToken: await workerToken({
                    collectionId: operation.collectionId,
                    projectId: operation.projectId,
                }),
            })
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId)
        }
        if (operation.hookType === TriggerHookType.TEST) {
            return result as ExecuteTestOrRunTriggerResponse
        }
        if (operation.hookType === TriggerHookType.RUN) {
            return result as unknown[]
        }
        return result as void
    },

    async executeProp(operation: ExecutePropsOptions): Promise<Record<string, DynamicPropsValue>> {
        log.debug(operation, '[EngineHelper#executeProp] operation')

        const sandbox = sandboxManager.obtainSandbox()
        let result

        try {
            await sandbox.cleanAndInit()

            const path = sandbox.getSandboxFolderPath()
            const { pieceName, pieceVersion } = operation

            await installPiece({
                path,
                pieceName,
                pieceVersion,
            })

            result = await execute(EngineOperationType.EXECUTE_PROPERTY, sandbox, {
                ...operation,
                workerToken: await workerToken({
                    collectionId: operation.collectionId,
                    projectId: operation.projectId,
                }),
            })
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId)
        }

        return result
    },

    async executeAction(operation: ExecuteActionOperation): Promise<unknown> {
        log.debug(operation, '[EngineHelper#executeAction] operation')

        const sandbox = sandboxManager.obtainSandbox()

        try {
            await sandbox.cleanAndInit()

            const path = sandbox.getSandboxFolderPath()
            const { pieceName, pieceVersion } = operation

            await installPiece({
                path,
                pieceName,
                pieceVersion,
            })

            const result = await execute(EngineOperationType.EXECUTE_ACTION, sandbox, {
                ...operation,
                workerToken: await workerToken({
                    collectionId: operation.collectionId,
                    projectId: operation.projectId,
                }),
            })

            return result
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId)
        }
    },
}

function workerToken(request: { projectId: ProjectId, collectionId: CollectionId }): Promise<string> {
    return tokenUtils.encode({
        type: PrincipalType.WORKER,
        id: apId(),
        projectId: request.projectId,
        collectionId: request.collectionId,
    })
}

async function execute(operation: EngineOperationType, sandbox: Sandbox, input: EngineOperation): Promise<unknown> {
    log.info(`Executing ${operation} inside sandbox number ${sandbox.boxId}`)

    const sandboxPath = sandbox.getSandboxFolderPath()

    await fs.copyFile(engineExecutablePath, `${sandboxPath}/activepieces-engine.js`)

    await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify({
        ...input,
        apiUrl: 'http://127.0.0.1:3000',
    }))

    await sandbox.runCommandLine(`${nodeExecutablePath} activepieces-engine.js ${operation}`)

    const standardOutput = await sandbox.parseStandardOutput()
    const standardError = await sandbox.parseStandardError()

    standardOutput.split('\n').forEach(f => {
        if (f.trim().length > 0) log.info({}, chalk.yellow(f))
    })

    standardError.split('\n').forEach(f => {
        if (f.trim().length > 0) log.error({}, chalk.red(f))
    })

    const outputFilePath = sandbox.getSandboxFilePath('output.json')
    const outputFile = await fs.readFile(outputFilePath, { encoding: 'utf-8' })

    return JSON.parse(outputFile)
}
