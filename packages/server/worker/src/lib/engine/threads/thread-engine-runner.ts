import path from 'path'
import { logger, networkUtls, SharedSystemProp, system, webhookSecretsUtils, WorkerSystemProps } from '@activepieces/server-shared'
import { ActionType, EngineOperation, EngineOperationType, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, flowStructureUtil, FlowVersion, isNil, TriggerHookType } from '@activepieces/shared'
import { webhookUtils } from '../../utils/webhook-utils'
import { EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from '../engine-runner'
import { executionFiles } from '../execution-files'
import { pieceEngineUtil } from '../flow-engine-util'
import { EngineWorker } from './worker'

const memoryLimit = Math.floor((Number(system.getOrThrow(SharedSystemProp.SANDBOX_MEMORY_LIMIT)) / 1024))
const sandboxPath = path.resolve('cache')
const codesPath = path.resolve('cache', 'codes')
const enginePath = path.join(sandboxPath, 'main.js')
// TODO separate this to a config file from flow worker concurrency as execute step is different operation
const workerConcurrency = Math.max(5, system.getNumber(WorkerSystemProps.FLOW_WORKER_CONCURRENCY) ?? 10)
let engineWorkers: EngineWorker

export const threadEngineRunner: EngineRunner = {
    async executeFlow(engineToken, operation) {
        logger.debug({
            flowVersion: operation.flowVersion.id,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeFlow]')
        await prepareFlowSandbox(engineToken, operation.flowVersion)

        const input: ExecuteFlowOperation = {
            ...operation,
            engineToken,
            publicUrl: await networkUtls.getPublicUrl(),
            internalApiUrl: networkUtls.getInternalApiUrl(),
        }

        return execute(input, EngineOperationType.EXECUTE_FLOW)
    },
    async executeTrigger(engineToken, operation) {
        logger.debug({
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
            appWebhookUrl: await webhookUtils.getAppWebhookUrl({
                appName: triggerPiece.pieceName,
            }),
            publicUrl: await networkUtls.getPublicUrl(),
            internalApiUrl: networkUtls.getInternalApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(lockedVersion),
            engineToken,
        }
        await executionFiles.provision({
            pieces: [triggerPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        return execute(input, EngineOperationType.EXECUTE_TRIGGER_HOOK)
    },
    async extractPieceMetadata(operation) {
        logger.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')

        await executionFiles.provision({
            pieces: [operation],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        return execute(operation, EngineOperationType.EXTRACT_PIECE_METADATA)
    },
    async executeValidateAuth(engineToken, operation) {
        logger.debug({ operation }, '[threadEngineRunner#executeValidateAuth]')

        const { piece } = operation
        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        await executionFiles.provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            publicUrl: await networkUtls.getPublicUrl(),
            internalApiUrl: networkUtls.getInternalApiUrl(),
            engineToken,
        }
        return execute(input, EngineOperationType.EXECUTE_VALIDATE_AUTH)
    },
    async executeAction(engineToken, operation) {
        logger.debug({
            stepName: operation.stepName,
            flowVersionId: operation.flowVersion.id,
        }, '[threadEngineRunner#executeAction]')

        const step = flowStructureUtil.getActionOrThrow(operation.stepName, operation.flowVersion.trigger)
        switch (step.type) {
            case ActionType.PIECE: {
                const lockedPiece = await pieceEngineUtil.getExactPieceForStep(engineToken, step)
                await executionFiles.provision({
                    pieces: [lockedPiece],
                    codeSteps: [],
                    globalCachePath: sandboxPath,
                    globalCodesPath: codesPath,
                    customPiecesPath: sandboxPath,
                })
                break
            }
            case ActionType.CODE: {
                const codes = pieceEngineUtil.getCodeSteps(operation.flowVersion).filter((code) => code.name === operation.stepName)
                await executionFiles.provision({
                    pieces: [],
                    codeSteps: codes,
                    globalCachePath: sandboxPath,
                    globalCodesPath: codesPath,
                    customPiecesPath: sandboxPath,
                })
                break
            }
            case ActionType.ROUTER:
            case ActionType.LOOP_ON_ITEMS:
                break
        }

        const lockedFlowVersion = await pieceEngineUtil.lockSingleStepPieceVersion({
            engineToken,
            flowVersion: operation.flowVersion,
            stepName: operation.stepName,
        })

        const input: ExecuteStepOperation = {
            flowVersion: lockedFlowVersion,
            stepName: operation.stepName,
            projectId: operation.projectId,
            sampleData: operation.sampleData,
            publicUrl: await networkUtls.getPublicUrl(),
            internalApiUrl: networkUtls.getInternalApiUrl(),
            engineToken,
        }

        return execute(input, EngineOperationType.EXECUTE_STEP)
    },
    async executeProp(engineToken, operation) {
        logger.debug({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.actionOrTriggerName,
        }, '[threadEngineRunner#executeProp]')

        const { piece } = operation

        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        await executionFiles.provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })

        const input: ExecutePropsOptions = {
            ...operation,
            publicUrl: await networkUtls.getPublicUrl(),
            internalApiUrl: networkUtls.getInternalApiUrl(),
            engineToken,
        }
        return execute(input, EngineOperationType.EXECUTE_PROPERTY)
    },
}

async function prepareFlowSandbox(engineToken: string, flowVersion: FlowVersion): Promise<void> {
    const pieces = await pieceEngineUtil.extractFlowPieces({
        flowVersion,
        engineToken,
    })
    const codeSteps = pieceEngineUtil.getCodeSteps(flowVersion)
    await executionFiles.provision({
        pieces,
        codeSteps,
        globalCachePath: sandboxPath,
        globalCodesPath: codesPath,
        customPiecesPath: sandboxPath,
    })
}

async function execute<Result extends EngineHelperResult>(operation: EngineOperation, operationType: EngineOperationType): Promise<EngineHelperResponse<Result>> {

    const startTime = Date.now()
    if (isNil(engineWorkers)) {
        engineWorkers = new EngineWorker(workerConcurrency, enginePath, {
            env: getEnvironmentVariables(),
            resourceLimits: {
                maxOldGenerationSizeMb: memoryLimit,
                maxYoungGenerationSizeMb: memoryLimit,
                stackSizeMb: memoryLimit,
            },
        })
    }
    const { engine, stdError, stdOut } = await engineWorkers.executeTask(operationType, operation)
    return engineRunnerUtils.readResults({
        timeInSeconds: (Date.now() - startTime) / 1000,
        verdict: engine.status,
        output: engine.response,
        standardOutput: stdOut,
        standardError: stdError,
    })
}

function getEnvironmentVariables(): Record<string, string | undefined> {
    const allowedEnvVariables = system.getList(SharedSystemProp.SANDBOX_PROPAGATED_ENV_VARS)
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
    return {
        ...propagatedEnvVars,
        NODE_OPTIONS: '--enable-source-maps',
        AP_PAUSED_FLOW_TIMEOUT_DAYS: system.getOrThrow(SharedSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
        AP_EXECUTION_MODE: system.getOrThrow(SharedSystemProp.EXECUTION_MODE),
        AP_PIECES_SOURCE: system.getOrThrow(SharedSystemProp.PIECES_SOURCE),
        AP_BASE_CODE_DIRECTORY: `${sandboxPath}/codes`,
        AP_MAX_FILE_SIZE_MB: system.getOrThrow(SharedSystemProp.MAX_FILE_SIZE_MB),
    }
}