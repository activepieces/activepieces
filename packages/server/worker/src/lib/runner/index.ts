import { webhookSecretsUtils } from '@activepieces/server-shared'
import { ActionType, EngineOperation, EngineOperationType, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteToolOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, flowStructureUtil, FlowVersion, isNil, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { executionFiles } from '../cache/execution-files'
import { pieceEngineUtil } from '../utils/flow-engine-util'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'
import { EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from './engine-runner-types'
import { EngineProcessManager } from './process/engine-process-manager'


let processManager: EngineProcessManager

export const engineRunner = (log: FastifyBaseLogger): EngineRunner => ({
    async executeFlow(engineToken, operation) {
        log.debug({
            flowVersion: operation.flowVersion.id,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeFlow]')
        await prepareFlowSandbox(log, engineToken, operation.flowVersion, operation.runEnvironment, operation.projectId)

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
            customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
        })
        return execute(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK)
    },
    async extractPieceMetadata(engineToken, operation) {
        log.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')

        const lockedPiece = await pieceEngineUtil(log).resolveExactVersion(engineToken, operation)
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
        const lockedPiece = await pieceEngineUtil(log).resolveExactVersion(engineToken, piece)
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
                    customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
                })
                break
            }
            case ActionType.CODE: {
                const codes = pieceEngineUtil(log).getCodeSteps(operation.flowVersion).filter((code) => code.name === operation.stepName)
                await executionFiles(log).provision({
                    pieces: [],
                    codeSteps: codes,
                    customPiecesPath: executionFiles(log).getCustomPiecesPath(operation),
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
            requestId: operation.requestId,
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

        const lockedPiece = await pieceEngineUtil(log).resolveExactVersion(engineToken, piece)
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

        const lockedPiece = await pieceEngineUtil(log).resolveExactVersion(engineToken, operation)
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
        if (!isNil(processManager)) {
            await processManager.shutdown()
        }
    },
})

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, flowVersion: FlowVersion, runEnvironment: RunEnvironment, projectId: string): Promise<void> {
    const pieces = await pieceEngineUtil(log).extractFlowPieces({
        flowVersion,
        engineToken,
    })
    const codeSteps = pieceEngineUtil(log).getCodeSteps(flowVersion)
    await executionFiles(log).provision({
        pieces,
        codeSteps,
        customPiecesPath: executionFiles(log).getCustomPiecesPath({ projectId }),
    })
}


async function execute<Result extends EngineHelperResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType): Promise<EngineHelperResponse<Result>> {
    const memoryLimit = Math.floor(Number(workerMachine.getSettings().SANDBOX_MEMORY_LIMIT) / 1024)

    const startTime = Date.now()
    if (isNil(processManager)) {
        processManager = new EngineProcessManager(log, workerMachine.getSettings().FLOW_WORKER_CONCURRENCY + workerMachine.getSettings().SCHEDULED_WORKER_CONCURRENCY, {
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
    const { engine, stdError, stdOut } = await processManager.executeTask(operationType, operation)
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
        AP_MAX_FILE_SIZE_MB: workerMachine.getSettings().MAX_FILE_SIZE_MB.toString(),
        AP_FILE_STORAGE_LOCATION: workerMachine.getSettings().FILE_STORAGE_LOCATION,
        AP_S3_USE_SIGNED_URLS: workerMachine.getSettings().S3_USE_SIGNED_URLS,
    }
}