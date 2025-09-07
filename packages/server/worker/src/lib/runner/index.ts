import { webhookSecretsUtils } from '@activepieces/server-shared'
import { EngineOperation, EngineOperationType, ExecuteFlowOperation, ExecutePropsOptions, ExecuteToolOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PackageType, PieceActionSettings, PieceTriggerSettings, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceWorkerCache } from '../cache/piece-worker-cache'
import { executionFiles } from '../cache/execution-files'
import { pieceEngineUtil } from '../utils/flow-engine-util'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'
import { EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from './engine-runner-types'
import { engineProcessManager } from './process/engine-process-manager'


export const engineRunner = (log: FastifyBaseLogger): EngineRunner => ({
    async executeFlow(engineToken, operation) {
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

        return execute(log, input, EngineOperationType.EXECUTE_FLOW)
    },
    async executeTrigger(engineToken, operation) {
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
        }
        await executionFiles(log).provision({
            pieces: [triggerPiece],
            codeSteps: [],
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        return execute(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK)
    },
    async extractPieceMetadata(engineToken, operation) {
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
        return execute(log, operation, EngineOperationType.EXTRACT_PIECE_METADATA)
    },
    async executeValidateAuth(engineToken, operation) {

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
        return execute(log, input, EngineOperationType.EXECUTE_VALIDATE_AUTH)
    },
    async executeProp(engineToken, operation) {
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
        return execute(log, input, EngineOperationType.EXECUTE_PROPERTY)
    },
    async excuteTool(engineToken, operation) {
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
        return execute(log, input, EngineOperationType.EXECUTE_TOOL)
    },
    async shutdownAllWorkers() {
        await engineProcessManager.shutdown()
    },
})

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, flowVersion: FlowVersion, projectId: string): Promise<void> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const pieces = steps.filter((step) => step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE).map(async (step) => {
        const { pieceName, pieceVersion } = step.settings as PieceTriggerSettings | PieceActionSettings
        const pieceMetadata = await pieceWorkerCache.getPiece({
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


async function execute<Result extends EngineHelperResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType): Promise<EngineHelperResponse<Result>> {
    const startTime = Date.now()
    const { engine, stdError, stdOut } = await engineProcessManager.executeTask(operationType, operation, log)
    return engineRunnerUtils(log).readResults({
        timeInSeconds: (Date.now() - startTime) / 1000,
        verdict: engine.status,
        output: engine.response,
        standardOutput: stdOut,
        standardError: stdError,
    })
}
