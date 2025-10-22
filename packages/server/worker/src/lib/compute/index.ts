import { webhookSecretsUtils } from '@activepieces/server-shared'
import { BeginExecuteFlowOperation, EngineOperation, EngineOperationType, ExecuteExtractPieceMetadataOperation, ExecuteFlowOperation, ExecutePropsOptions, ExecuteToolOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PackageType, PieceActionSettings, PieceTriggerSettings, ResumeExecuteFlowOperation, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { executionFiles } from '../cache/execution-files'
import { pieceWorkerCache } from '../cache/piece-worker-cache'
import { pieceEngineUtil } from '../utils/flow-engine-util'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'
import { EngineHelperActionResult, EngineHelperExtractPieceInformation, EngineHelperFlowResult, EngineHelperPropResult, EngineHelperResponse, EngineHelperResult, EngineHelperTriggerResult, EngineHelperValidateAuthResult, engineRunnerUtils } from './engine-runner-types'
import { engineProcessManager } from './process/engine-process-manager'

type EngineConstants = 'publicApiUrl' | 'internalApiUrl' | 'engineToken'

export const engineRunner = (log: FastifyBaseLogger) => ({
    async executeFlow(engineToken: string, operation: Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        log.debug({
            flowVersion: operation.flowVersion.id,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeFlow]')
        await prepareFlowSandbox(log, engineToken, operation.flowVersion, operation.projectId)

        const input: ExecuteFlowOperation = {
            ...operation,
            engineToken,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
        }

        return execute(log, input, EngineOperationType.EXECUTE_FLOW, operation.timeoutInSeconds)
    },
    async executeTrigger<T extends TriggerHookType>(engineToken: string, operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>> {
        log.debug({
            hookType: operation.hookType,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeTrigger]')

        const triggerPiece = await pieceEngineUtil.getTriggerPiece(engineToken, operation.flowVersion)
        const lockedVersion = await pieceEngineUtil.lockSingleStepPieceVersion({
            engineToken,
            stepName: operation.flowVersion.trigger.name,
            flowVersion: operation.flowVersion,
        })
        const input: ExecuteTriggerOperation<TriggerHookType> = {
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            triggerPayload: operation.triggerPayload,
            test: operation.test,
            flowVersion: lockedVersion,
            appWebhookUrl: await webhookUtils(log).getAppWebhookUrl({
                appName: triggerPiece.pieceName,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(lockedVersion),
            engineToken,
            timeoutInSeconds: operation.timeoutInSeconds,
        }
        await executionFiles(log).provision({
            pieces: [triggerPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        return execute(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK, operation.timeoutInSeconds)
    },
    async extractPieceMetadata(engineToken: string, operation: ExecuteExtractPieceMetadataOperation): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        log.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')

        const lockedPiece = await pieceEngineUtil.enrichPieceWithArchive(engineToken, {
            name: operation.pieceName,
            version: operation.pieceVersion,
            packageType: operation.packageType,
            pieceType: operation.pieceType,
            archiveId: operation.packageType === PackageType.ARCHIVE ? operation.archiveId : undefined,
        })
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        return execute(log, operation, EngineOperationType.EXTRACT_PIECE_METADATA, operation.timeoutInSeconds)
    },
    async executeValidateAuth(engineToken: string, operation: Omit<ExecuteValidateAuthOperation, EngineConstants>): Promise<EngineHelperResponse<EngineHelperValidateAuthResult>> {

        log.debug({ ...operation.piece, platformId: operation.platformId }, '[threadEngineRunner#executeValidateAuth]')

        const { piece } = operation
        const lockedPiece = await pieceEngineUtil.resolveExactVersion(engineToken, piece)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(log, input, EngineOperationType.EXECUTE_VALIDATE_AUTH, operation.timeoutInSeconds)
    },
    async executeProp(engineToken: string, operation: Omit<ExecutePropsOptions, EngineConstants>): Promise<EngineHelperResponse<EngineHelperPropResult>> {
        log.debug({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.actionOrTriggerName,
        }, '[threadEngineRunner#executeProp]')

        const { piece } = operation

        const lockedPiece = await pieceEngineUtil.resolveExactVersion(engineToken, piece)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })

        const input: ExecutePropsOptions = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(log, input, EngineOperationType.EXECUTE_PROPERTY, operation.timeoutInSeconds)
    },
    async excuteTool(engineToken: string, operation: Omit<ExecuteToolOperation, EngineConstants>): Promise<EngineHelperResponse<EngineHelperActionResult>> {
        log.debug({ operation }, '[threadEngineRunner#excuteTool]')

        const lockedPiece = await pieceEngineUtil.resolveExactVersion(engineToken, operation)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        const input: ExecuteToolOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(log, input, EngineOperationType.EXECUTE_TOOL, operation.timeoutInSeconds)
    },
    async shutdownAllWorkers(): Promise<void> {
        await engineProcessManager.shutdown()
    },
})

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, flowVersion: FlowVersion, projectId: string): Promise<void> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const pieces = steps.filter((step) => step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE).map(async (step) => {
        const { pieceName, pieceVersion } = step.settings as PieceTriggerSettings | PieceActionSettings
        const pieceMetadata = await pieceWorkerCache(log).getPiece({
            engineToken,
            pieceName,
            pieceVersion,
            projectId,
        })
        return pieceEngineUtil.enrichPieceWithArchive(engineToken, pieceMetadata)
    })
    const codeSteps = pieceEngineUtil.getCodeSteps(flowVersion)
    await executionFiles(log).provision({
        pieces: await Promise.all(pieces),
        codeSteps,
        customPiecesPath: executionFiles(log).getCustomPiecesPath({ projectId }),
    })
}

async function execute<Result extends EngineHelperResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType, timeoutInSeconds: number): Promise<EngineHelperResponse<Result>> {
    const startTime = Date.now()
    const { engine, stdError, stdOut } = await engineProcessManager.executeTask(operationType, operation, log, timeoutInSeconds)
    return engineRunnerUtils(log).readResults({
        timeInSeconds: (Date.now() - startTime) / 1000,
        verdict: engine.status,
        output: engine.response,
        standardOutput: stdOut,
        standardError: stdError,
    })
}
