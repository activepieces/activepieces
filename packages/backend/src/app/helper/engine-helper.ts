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
    ExecuteCodeOperation,
    ExecuteExtractPieceMetadata,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    EngineTestOperation,
    CodeActionSettings,
} from '@activepieces/shared'
import { Sandbox } from '../workers/sandbox'
import { sandboxManager } from '../workers/sandbox/sandbox-manager'
import { tokenUtils } from '../authentication/lib/token-utils'
import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
} from '@activepieces/pieces-framework'
import { logger } from '../helper/logger'
import chalk from 'chalk'
import { getEdition, getWebhookSecret } from './secret-helper'
import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { pieceManager } from '../flows/common/piece-installer'
import { packageManager } from './package-manager'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { codeBuilder } from '../workers/code-worker/code-builder'
import { fileService } from '../file/file.service'
import { SandBoxProvisionType, sandboxProvisioner } from '../workers/sandbox/sandbox-provisioner'

type InstallPieceParams = {
    projectId: string
    path: string
    pieceName: string
    pieceVersion: string
}

type GetSandboxParams = {
    projectId: string
    pieceName: string
    pieceVersion: string
}

type GenerateWorkerTokenParams = {
    projectId: ProjectId
}

export type EngineHelperFlowResult = ExecutionOutput

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult =
  | DropdownState<unknown>
  | Record<string, DynamicPropsValue>

export type EngineHelperActionResult = ExecuteActionResponse

export type EngineHelperValidateAuthResult = ExecuteValidateAuthResponse

export type EngineHelperCodeResult = ExecuteActionResponse
export type EngineHelperExtractPieceInformation = Omit<
PieceMetadata,
'name' | 'version'
>

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

const generateWorkerToken = (
    request: GenerateWorkerTokenParams,
): Promise<string> => {
    return tokenUtils.encode({
        type: PrincipalType.WORKER,
        id: apId(),
        projectId: request.projectId,
    })
}

const getSandbox = async ({ pieceName, pieceVersion, projectId }: GetSandboxParams): Promise<Sandbox> => {
    const sandbox = await sandboxManager.obtainSandbox()

    logger.info(`[EngineHelper#getSandbox] sandboxId=${sandbox.boxId}`)

    const path = sandbox.getSandboxFolderPath()

    await installPiece({
        projectId,
        path,
        pieceName,
        pieceVersion,
    })

    return sandbox
}

function tryParseJson(value: unknown) {
    try {
        return JSON.parse(value as string)
    }
    catch (e) {
        return value
    }
}

const execute = async <Result extends EngineHelperResult>(
    operation: EngineOperationType,
    sandbox: Sandbox,
    input: EngineOperation,
): Promise<EngineHelperResponse<Result>> => {
    logger.debug(`Executing ${operation} inside sandbox number ${sandbox.boxId}`)
    logger.debug(`[EngineHelper#execute] workerToken=${(input as Record<string, string>).workerToken}`)

    const sandboxPath = sandbox.getSandboxFolderPath()

    await fs.writeFile(
        `${sandboxPath}/input.json`,
        JSON.stringify({
            ...input,
            apiUrl: 'http://127.0.0.1:3000',
        }),
    )

    const nodeExecutablePath = process.execPath
    const sandboxResponse = await sandbox.runCommandLine(`${nodeExecutablePath} /root/main.js ${operation}`)

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

    const result: Result = tryParseJson(sandboxResponse.output)

    const response = {
        status: sandboxResponse.verdict,
        result,
        standardError: sandboxResponse.standardError,
        standardOutput: sandboxResponse.standardOutput,
    }

    logger.trace(response, '[EngineHelper#response] response')

    return response
}

export const engineHelper = {
    async executeFlow(
        sandbox: Sandbox,
        operation: ExecuteFlowOperation,
    ): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.info(
            { ...operation, triggerPayload: undefined, executionState: undefined },
            '[EngineHelper#executeFlow] operation',
        )

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        return await execute(EngineOperationType.EXECUTE_FLOW, sandbox, input)
    },

    async executeTrigger<T extends TriggerHookType>(
        operation: ExecuteTriggerOperation<T>,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>> {
        const lockedFlowVersion = await flowVersionService.lockPieceVersions(
            operation.projectId,
            operation.flowVersion,
        )
        const { pieceName, pieceVersion } = (
            lockedFlowVersion.trigger as PieceTrigger
        ).settings

        const sandbox = await getSandbox({
            projectId: operation.projectId,
            pieceName,
            pieceVersion,
        })

        const input = {
            ...operation,
            flowVersion: lockedFlowVersion,
            edition: getEdition(),
            appWebhookUrl: await appEventRoutingService.getAppWebhookUrl({
                appName: pieceName,
            }),
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

        const result = await pieceMetadataService.get({
            projectId: operation.projectId,
            name: operation.pieceName,
            version: operation.pieceVersion,
        })

        const sandbox = await getSandbox({
            projectId: operation.projectId,
            pieceName: result.name,
            pieceVersion: result.version,
        })

        const input = {
            ...operation,
            pieceVersion: result.version,
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

    async executeCode(
        operation: ExecuteCodeOperation,
    ): Promise<EngineHelperResponse<EngineHelperCodeResult>> {
        logger.debug(operation, '[EngineHelper#executeAction] operation')

        const sourceId = (operation.step.settings as CodeActionSettings).artifactSourceId!

        const fileEntity = await fileService.getOneOrThrow({
            projectId: operation.projectId,
            fileId: sourceId,
        })

        const sandbox = await sandboxManager.obtainSandbox()

        try {
            await codeBuilder.processCodeStep({
                codeZip: fileEntity.data,
                sourceCodeId: sourceId,
                buildPath: sandbox.getSandboxFolderPath(),
            })

            const input = {
                ...operation,
                workerToken: await generateWorkerToken({ projectId: operation.projectId }),
            }
            return execute(EngineOperationType.EXECUTE_CODE, sandbox, input)
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async extractPieceMetadata(
        operation: ExecuteExtractPieceMetadata,
    ): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        logger.info(operation, '[EngineHelper#ExecuteExtractPieceMetadata] operation')

        const sandbox = await sandboxManager.obtainSandbox()

        try {
            await packageManager.addDependencies(sandbox.getSandboxFolderPath(), {
                [operation.pieceName]: {
                    version: operation.pieceVersion,
                },
            })

            return await execute(
                EngineOperationType.EXTRACT_PIECE_METADATA,
                sandbox,
                operation,
            )
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeAction(
        operation: ExecuteActionOperation,
    ): Promise<EngineHelperResponse<EngineHelperActionResult>> {
        logger.debug(operation, '[EngineHelper#executeAction] operation')

        const { pieceName, pieceVersion } = operation

        const pieces = [
            {
                name: pieceName,
                version: pieceVersion,
            },
        ]

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxProvisionType.ACTION_RUN,
            pieceName,
            pieceVersion,
            pieces,
        })

        try {
            const input = {
                ...operation,
                workerToken: await generateWorkerToken({ projectId: operation.projectId }),
            }

            return await execute(EngineOperationType.EXECUTE_ACTION, sandbox, input)
        }
        finally {
            await sandboxProvisioner.release({
                sandbox,
            })
        }
    },

    async executeValidateAuth(
        operation: ExecuteValidateAuthOperation,
    ): Promise<EngineHelperResponse<EngineHelperValidateAuthResult>> {
        logger.debug(operation, '[EngineHelper#executeValidateAuth] operation')

        const { pieceName, pieceVersion } = operation

        const sandbox = await getSandbox({
            projectId: operation.projectId,
            pieceName,
            pieceVersion,
        })

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        try {
            return await execute(
                EngineOperationType.EXECUTE_VALIDATE_AUTH,
                sandbox,
                input,
            )
        }
        finally {
            await sandboxManager.returnSandbox(sandbox.boxId)
        }
    },

    async executeTest(sandbox: Sandbox, operation: EngineTestOperation): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.debug(
            { ...operation, triggerPayload: undefined, executionState: undefined },
            '[EngineHelper#executeTest] operation',
        )

        const input = {
            ...operation,
            workerToken: await generateWorkerToken({ projectId: operation.projectId }),
        }

        return await execute(EngineOperationType.EXECUTE_TEST, sandbox, input)
    },
}
