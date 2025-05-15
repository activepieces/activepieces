import path from 'path'
import { webhookSecretsUtils } from '@activepieces/server-shared'
import { ActionType, EngineOperation, EngineOperationType, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteToolOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, flowStructureUtil, FlowVersion, isNil, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../utils/machine'
import { webhookUtils } from '../../utils/webhook-utils'
import { EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from '../engine-runner'
import { executionFiles } from '../execution-files'
import { pieceEngineUtil } from '../flow-engine-util'
import { EngineWorker } from './worker'

const sandboxPath = path.resolve('cache')
const codesPath = path.resolve('cache', 'codes')
const enginePath = path.join(sandboxPath, 'main.js')
let engineWorkers: EngineWorker

export const threadEngineRunner = (log: FastifyBaseLogger): EngineRunner => ({
    async executeFlow(engineToken, operation) {
        log.debug({
            flowVersion: operation.flowVersion.id,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeFlow]')
        await prepareFlowSandbox(log, engineToken, operation.flowVersion, operation.runEnvironment)

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

        const triggerPiece = await pieceEngineUtil(log).getTriggerPiece(engineToken, operation.flowVersion)
        const lockedVersion = await pieceEngineUtil(log).lockSingleStepPieceVersion({
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
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        return execute(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK)
    },
    async extractPieceMetadata(engineToken, operation) {
        log.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')

        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, operation)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        return execute(log, operation, EngineOperationType.EXTRACT_PIECE_METADATA)
    },
    async executeValidateAuth(engineToken, operation) {
        log.debug({ operation }, '[threadEngineRunner#executeValidateAuth]')

        const { piece } = operation
        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, piece)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(log, input, EngineOperationType.EXECUTE_VALIDATE_AUTH)
    },
    async executeAction(engineToken, operation) {
        log.debug({
            stepName: operation.stepName,
            flowVersionId: operation.flowVersion.id,
        }, '[threadEngineRunner#executeAction]')

        const step = flowStructureUtil.getActionOrThrow(operation.stepName, operation.flowVersion.trigger)
        switch (step.type) {
            case ActionType.PIECE: {
                const lockedPiece = await pieceEngineUtil(log).getExactPieceForStep(engineToken, step)
                await executionFiles(log).provision({
                    pieces: [lockedPiece],
                    codeSteps: [],
                    globalCachePath: sandboxPath,
                    globalCodesPath: codesPath,
                    customPiecesPath: sandboxPath,
                })
                break
            }
            case ActionType.CODE: {
                const codes = pieceEngineUtil(log).getCodeSteps(operation.flowVersion).filter((code) => code.name === operation.stepName)
                await executionFiles(log).provision({
                    pieces: [],
                    codeSteps: codes,
                    globalCachePath: sandboxPath,
                    globalCodesPath: codesPath,
                    customPiecesPath: sandboxPath,
                    runEnvironment: operation.runEnvironment,
                })
                break
            }
            case ActionType.ROUTER:
            case ActionType.LOOP_ON_ITEMS:
                break
        }

        const lockedFlowVersion = await pieceEngineUtil(log).lockSingleStepPieceVersion({
            engineToken,
            flowVersion: operation.flowVersion,
            stepName: operation.stepName,
        })

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

        return execute(log, input, EngineOperationType.EXECUTE_STEP)
    },
    async executeProp(engineToken, operation) {
        log.debug({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.actionOrTriggerName,
        }, '[threadEngineRunner#executeProp]')

        const { piece } = operation

        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, piece)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
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

        const lockedPiece = await pieceEngineUtil(log).getExactPieceVersion(engineToken, operation)
        await executionFiles(log).provision({
            pieces: [lockedPiece],
            codeSteps: [],
            globalCachePath: sandboxPath,
            globalCodesPath: codesPath,
            customPiecesPath: sandboxPath,
        })
        const input: ExecuteToolOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return execute(log, input, EngineOperationType.EXECUTE_TOOL)
    },
})

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, flowVersion: FlowVersion, runEnvironment: RunEnvironment): Promise<void> {
    const pieces = await pieceEngineUtil(log).extractFlowPieces({
        flowVersion,
        engineToken,
    })
    const codeSteps = pieceEngineUtil(log).getCodeSteps(flowVersion)
    await executionFiles(log).provision({
        pieces,
        codeSteps,
        globalCachePath: sandboxPath,
        globalCodesPath: codesPath,
        customPiecesPath: sandboxPath,
        runEnvironment,
    })
}

async function execute<Result extends EngineHelperResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType): Promise<EngineHelperResponse<Result>> {
    const memoryLimit = Math.floor(Number(workerMachine.getSettings().SANDBOX_MEMORY_LIMIT) / 1024)

    const startTime = Date.now()
    if (isNil(engineWorkers)) {
        engineWorkers = new EngineWorker(log, workerMachine.getSettings().FLOW_WORKER_CONCURRENCY + workerMachine.getSettings().SCHEDULED_WORKER_CONCURRENCY, enginePath, {
            env: getEnvironmentVariables(),
            resourceLimits: {
                maxOldGenerationSizeMb: memoryLimit,
                maxYoungGenerationSizeMb: memoryLimit,
                stackSizeMb: memoryLimit,
            },
            execArgv: [
                `--max-old-space-size=${memoryLimit}`,
                `--max-semi-space-size=${memoryLimit}`,
                `--stack-size=${memoryLimit * 1024}`, // stack size is in KB
            ],
        })
    }
    const { engine, stdError, stdOut } = await engineWorkers.executeTask(operationType, operation)
    return engineRunnerUtils(log).readResults({
        timeInSeconds: (Date.now() - startTime) / 1000,
        verdict: engine.status,
        output: engine.response,
        standardOutput: stdOut,
        standardError: stdError,
    })
}

function getEnvironmentVariables(): Record<string, string | undefined> {
    const allowedEnvVariables = workerMachine.getSettings().SANDBOX_PROPAGATED_ENV_VARS
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
    return {
        ...propagatedEnvVars,
        NODE_OPTIONS: '--enable-source-maps',
        AP_PAUSED_FLOW_TIMEOUT_DAYS: workerMachine.getSettings().PAUSED_FLOW_TIMEOUT_DAYS.toString(),
        AP_EXECUTION_MODE: workerMachine.getSettings().EXECUTION_MODE,
        AP_PIECES_SOURCE: workerMachine.getSettings().PIECES_SOURCE,
        AP_BASE_CODE_DIRECTORY: `${sandboxPath}/codes`,
        AP_MAX_FILE_SIZE_MB: workerMachine.getSettings().MAX_FILE_SIZE_MB.toString(),
        AP_FILE_STORAGE_LOCATION: workerMachine.getSettings().FILE_STORAGE_LOCATION,
        AP_S3_USE_SIGNED_URLS: workerMachine.getSettings().S3_USE_SIGNED_URLS,
    }
}