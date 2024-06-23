import fs from 'node:fs/promises'
import { encryptUtils, logger, networkUtls, webhookSecretsUtils } from '@activepieces/server-shared'
import { Action, ActionType, assertNotNullOrUndefined, EngineOperation, EngineOperationType, ExecuteExtractPieceMetadata, ExecuteFlowOperation, ExecuteStepOperation, flowHelper, FlowVersion, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { webhookUtils } from '../../utils/webhook-utils'
import { EngineHelperExtractPieceInformation, EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from '../engine-runner'
import { pieceEngineUtil } from '../flow-enginer-util'
import { IsolateSandbox } from './sandbox/isolate-sandbox'
import { SandBoxCacheType } from './sandbox/provisioner/sandbox-cache-key'
import { sandboxProvisioner } from './sandbox/provisioner/sandbox-provisioner'


export const isolateEngineRunner: EngineRunner = {
    async executeFlow(engineToken, operation) {
        const input: ExecuteFlowOperation = {
            ...operation,
            engineToken,
            serverUrl: await networkUtls.getApiUrl(),
        }
        const sandbox = await prepareFlowSandbox(engineToken, operation.runEnvironment, operation.flowVersion)
        return execute(EngineOperationType.EXECUTE_FLOW, sandbox, input)
    },
    async extractPieceMetadata(
        operation: ExecuteExtractPieceMetadata,
    ): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        logger.debug({ operation }, '[EngineHelper#extractPieceMetadata]')

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.NONE,
            pieces: [operation],
        })

        return execute(
            EngineOperationType.EXTRACT_PIECE_METADATA,
            sandbox,
            operation,
        )
    },
    async executeTrigger(engineToken, operation) {
        logger.debug(
            { hookType: operation.hookType, projectId: operation.projectId },
            '[EngineHelper#executeTrigger]',
        )
        const triggerPiece = await pieceEngineUtil.getTriggerPiece(engineToken, operation.flowVersion)
        const lockedVersion = await pieceEngineUtil.lockPieceInFlowVersion({
            engineToken,
            stepName: operation.flowVersion.trigger.name,
            flowVersion: operation.flowVersion,
        })
        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName: triggerPiece.pieceName,
            pieceVersion: triggerPiece.pieceVersion,
            pieces: [triggerPiece],
        })
        const input = {
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            pieceVersion: triggerPiece,
            flowVersion: lockedVersion,
            appWebhookUrl: await webhookUtils.getAppWebhookUrl({
                appName: triggerPiece.pieceName,
            }),
            serverUrl: await networkUtls.getApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(lockedVersion),
            engineToken,
        }
        return execute(EngineOperationType.EXECUTE_TRIGGER_HOOK, sandbox, input)
    },
    async executeProp(engineToken, operation) {
        const { piece } = operation
        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName: lockedPiece.pieceName,
            pieceVersion: lockedPiece.pieceVersion,
            pieces: [lockedPiece],
        })

        const input = {
            ...operation,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken,
        }

        return execute(EngineOperationType.EXECUTE_PROPERTY, sandbox, input)
    },
    async executeValidateAuth(engineToken, operation) {
        const { piece } = operation
        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName: lockedPiece.pieceName,
            pieceVersion: lockedPiece.pieceVersion,
            pieces: [lockedPiece],
        })
        const input = {
            ...operation,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken,
        }
        return execute(EngineOperationType.EXECUTE_VALIDATE_AUTH, sandbox, input)
    },
    async executeAction(engineToken, operation) {
        const step = flowHelper.getStep(operation.flowVersion, operation.stepName) as
            | Action
            | undefined
        assertNotNullOrUndefined(step, 'Step not found')

        const lockedFlowVersion = await pieceEngineUtil.lockPieceInFlowVersion({
            engineToken,
            flowVersion: operation.flowVersion,
            stepName: operation.stepName,
        })
        const sandbox = await getSandboxForAction(
            engineToken,
            lockedFlowVersion.id,
            lockedFlowVersion.state,
            lockedFlowVersion.flowId,
            step,
        )
        const input: ExecuteStepOperation = {
            flowVersion: lockedFlowVersion,
            stepName: operation.stepName,
            projectId: operation.projectId,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken,
        }

        return execute(EngineOperationType.EXECUTE_STEP, sandbox, input)
    },
}

const execute = async <Result extends EngineHelperResult>(
    operationType: EngineOperationType,
    sandbox: IsolateSandbox,
    input: EngineOperation,
): Promise<EngineHelperResponse<Result>> => {
    try {
        logger.trace(
            { operationType, sandboxId: sandbox.boxId },
            '[EngineHelper#execute]',
        )
        const sandboxPath = sandbox.getSandboxFolderPath()
        await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify(input))
        const sandboxResponse = await sandbox.runOperation(operationType, input)
        return await engineRunnerUtils.readResults(sandboxResponse)
    }
    finally {
        await sandboxProvisioner.release({ sandbox })

    }
}

async function prepareFlowSandbox(engineToken: string, runEnvironment: RunEnvironment, flowVersion: FlowVersion): Promise<IsolateSandbox> {
    const pieces = await pieceEngineUtil.extractFlowPieces({
        flowVersion,
        engineToken,
    })
    const codeSteps = pieceEngineUtil.getCodeSteps(flowVersion)
    switch (runEnvironment) {
        case RunEnvironment.PRODUCTION:
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.FLOW,
                flowVersionId: flowVersion.id,
                pieces,
                codeSteps,
            })
        case RunEnvironment.TESTING:
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.NONE,
                pieces,
                codeSteps,
            })
    }
}

async function getSandboxForAction(
    engineToken: string,
    flowVersionId: string,
    flowVersionState: FlowVersionState,
    flowId: string,
    action: Action,
): Promise<IsolateSandbox> {
    switch (action.type) {
        case ActionType.PIECE: {
            const { pieceName, pieceVersion } = action.settings
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.PIECE,
                pieceName,
                pieceVersion,
                pieces: [await pieceEngineUtil.getExactPieceForStep(engineToken, action)],
            })
        }
        case ActionType.CODE: {
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.CODE,
                flowId,
                name: action.name,
                sourceCodeHash: encryptUtils.hashObject(action.settings.sourceCode),
                codeSteps: [
                    {
                        name: action.name,
                        flowVersionId,
                        flowVersionState,
                        sourceCode: action.settings.sourceCode,
                    },
                ],
            })
        }
        case ActionType.BRANCH:
        case ActionType.LOOP_ON_ITEMS:
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.NONE,
            })
    }
}
