import fs from 'node:fs/promises'
import { webhookSecretsUtils } from '@activepieces/server-shared'
import { Action, ActionType, apId, EngineOperation, EngineOperationType, ExecuteExtractPieceMetadata, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteToolOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, flowStructureUtil, FlowVersion, FlowVersionState, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'
import { EngineHelperExtractPieceInformation, EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from '../engine-runner'
import { pieceEngineUtil } from '../flow-engine-util'
import { IsolateSandbox } from './sandbox/isolate-sandbox'
import { sandboxProvisioner } from './sandbox/provisioner/sandbox-provisioner'

export const isolateEngineRunner = (log: FastifyBaseLogger): EngineRunner => ({
    async executeFlow(engineToken, operation) {
        const input: ExecuteFlowOperation = {
            ...operation,
            engineToken,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
        }
        const sandbox = await prepareFlowSandbox(log, engineToken, operation.runEnvironment, operation.flowVersion, operation.projectId)
        return execute(EngineOperationType.EXECUTE_FLOW, sandbox, input, log)
    },
    async extractPieceMetadata(
        engineToken: string,
        operation: ExecuteExtractPieceMetadata,
    ): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        log.debug({ operation }, '[EngineHelper#extractPieceMetadata]')

        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, operation)
        const sandbox = await sandboxProvisioner(log).provision({
            pieces: [lockedPiece],
            customPiecesPathKey: apId(),
        })

        return execute(
            EngineOperationType.EXTRACT_PIECE_METADATA,
            sandbox,
            operation,
            log,
        )
    },
    async executeTrigger(engineToken, operation) {
        log.debug(
            { hookType: operation.hookType, projectId: operation.projectId },
            '[EngineHelper#executeTrigger]',
        )
        const triggerPiece = await pieceEngineUtil(log).getTriggerPiece(engineToken, operation.flowVersion)
        const lockedVersion = await pieceEngineUtil(log).lockSingleStepPieceVersion({
            engineToken,
            stepName: operation.flowVersion.trigger.name,
            flowVersion: operation.flowVersion,
        })
        const sandbox = await sandboxProvisioner(log).provision({
            pieces: [triggerPiece],
            customPiecesPathKey: operation.projectId,
        })
        const input: ExecuteTriggerOperation<TriggerHookType> = {
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            test: operation.test,
            triggerPayload: operation.triggerPayload,
            flowVersion: lockedVersion,
            appWebhookUrl: await webhookUtils(log).getAppWebhookUrl({
                appName: triggerPiece.pieceName,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(lockedVersion),
            engineToken,
        }
        return execute(EngineOperationType.EXECUTE_TRIGGER_HOOK, sandbox, input, log)
    },
    async executeProp(engineToken, operation) {
        const { piece } = operation
        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, piece)
        const sandbox = await sandboxProvisioner(log).provision({
            pieces: [lockedPiece],
            customPiecesPathKey: operation.projectId,
        })

        const input: ExecutePropsOptions = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }

        return execute(EngineOperationType.EXECUTE_PROPERTY, sandbox, input, log)
    },
    async executeValidateAuth(engineToken, operation) {
        const { piece, platformId } = operation
        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, piece)
        const sandbox = await sandboxProvisioner(log).provision({
            pieces: [lockedPiece],
            customPiecesPathKey: platformId,
        })
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(EngineOperationType.EXECUTE_VALIDATE_AUTH, sandbox, input, log)
    },
    async executeAction(engineToken, operation) {
        const step = flowStructureUtil.getActionOrThrow(operation.stepName, operation.flowVersion.trigger)
        const lockedFlowVersion = await pieceEngineUtil(log).lockSingleStepPieceVersion({
            engineToken,
            flowVersion: operation.flowVersion,
            stepName: operation.stepName,
        })
        const sandbox = await getSandboxForAction(
            engineToken,
            lockedFlowVersion.id,
            lockedFlowVersion.state,
            step,
            operation.projectId,
            operation.runEnvironment,
            log,
        )
        const input: ExecuteStepOperation = {
            flowVersion: lockedFlowVersion,
            stepName: operation.stepName,
            projectId: operation.projectId,
            sampleData: operation.sampleData,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
            runEnvironment: operation.runEnvironment,
        }

        return execute(EngineOperationType.EXECUTE_STEP, sandbox, input, log)
    },
    async excuteTool(engineToken, operation) {
        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, operation)
        const sandbox = await sandboxProvisioner(log).provision({
            pieces: [lockedPiece],
            customPiecesPathKey: `${operation.projectId}-${operation.pieceName}-${operation.pieceVersion}`,
        })
        const input: ExecuteToolOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(EngineOperationType.EXECUTE_TOOL, sandbox, input, log)
    },
})

const execute = async <Result extends EngineHelperResult>(
    operationType: EngineOperationType,
    sandbox: IsolateSandbox,
    input: EngineOperation,
    log: FastifyBaseLogger,
): Promise<EngineHelperResponse<Result>> => {
    try {
        log.trace(
            { operationType, sandboxId: sandbox.boxId },
            '[EngineHelper#execute]',
        )
        const sandboxPath = sandbox.getSandboxFolderPath()
        await fs.writeFile(`${sandboxPath}/input.json`, JSON.stringify(input))
        const sandboxResponse = await sandbox.runOperation(operationType, input)
        return await engineRunnerUtils(log).readResults(sandboxResponse)
    }
    finally {
        await sandboxProvisioner(log).release({ sandbox })

    }
}

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, runEnvironment: RunEnvironment, flowVersion: FlowVersion, projectId: string): Promise<IsolateSandbox> {
    const pieces = await pieceEngineUtil(log).extractFlowPieces({
        flowVersion,
        engineToken,
    })
    const codeSteps = pieceEngineUtil(log).getCodeSteps(flowVersion)
    return sandboxProvisioner(log).provision({
        pieces,
        codeSteps,
        runEnvironment,
        customPiecesPathKey: projectId,
    })
}

async function getSandboxForAction(
    engineToken: string,
    flowVersionId: string,
    flowVersionState: FlowVersionState,
    action: Action,
    projectId: string,
    runEnvironment: RunEnvironment,
    log: FastifyBaseLogger,
): Promise<IsolateSandbox> {
    switch (action.type) {
        case ActionType.PIECE: {
            return sandboxProvisioner(log).provision({
                pieces: [await pieceEngineUtil(log).getExactPieceForStep(engineToken, action)],
                customPiecesPathKey: projectId,
            })
        }
        case ActionType.CODE: {
            return sandboxProvisioner(log).provision({
                codeSteps: [
                    {
                        name: action.name,
                        flowVersionId,
                        flowVersionState,
                        sourceCode: action.settings.sourceCode,
                    },
                ],
                customPiecesPathKey: projectId,
                runEnvironment,
            })
        }
        case ActionType.ROUTER:
        case ActionType.LOOP_ON_ITEMS:
            return sandboxProvisioner(log).provision({
                customPiecesPathKey: projectId,
            })
    }
}
