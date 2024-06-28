import { mkdir } from 'fs/promises'
import path from 'path'
import { fileExists, logger, networkUtls, packageManager, system, SystemProp, webhookSecretsUtils } from '@activepieces/server-shared'
import { Action, ActionType, assertNotNullOrUndefined, CodeSandboxType, EngineOperation, EngineOperationType, ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteTriggerOperation, ExecuteValidateAuthOperation, flowHelper, FlowVersion, FlowVersionState, isNil, PiecePackage, TriggerHookType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { pieceManager } from '../../piece-manager'
import { codeBuilder } from '../../utils/code-builder'
import { engineInstaller } from '../../utils/engine-installer'
import { webhookUtils } from '../../utils/webhook-utils'
import { CodeArtifact, EngineHelperResponse, EngineHelperResult, EngineRunner, engineRunnerUtils } from '../engine-runner'
import { pieceEngineUtil } from '../flow-enginer-util'
import { EngineWorker, WorkerResult } from './worker'

const memoryLimit = Math.floor((Number(system.getOrThrow(SystemProp.SANDBOX_MEMORY_LIMIT)) / 1024))
const sandboxPath = path.resolve('cache')
const enginePath = path.join(sandboxPath, 'main.js')
const workerConcurrency = system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10
let engineWorkers: EngineWorker

// This a workound to make isolated-vm work in the worker thread check https://github.com/laverdet/isolated-vm/pull/402
/* eslint-disable */
const codeSandboxType = system.getOrThrow(SystemProp.CODE_SANDBOX_TYPE);
let ivm: any;
if (codeSandboxType === CodeSandboxType.V8_ISOLATE) {
    ivm = import('isolated-vm');
    const _strongReference = ivm.Isolate
}
/* eslint-enable */

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
            serverUrl: await networkUtls.getApiUrl(),
        }

        return execute(input, EngineOperationType.EXECUTE_FLOW)
    },
    async executeTrigger(engineToken, operation) {
        logger.debug({
            hookType: operation.hookType,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeTrigger]')

        const triggerPiece = await pieceEngineUtil.getTriggerPiece(engineToken, operation.flowVersion)
        const lockedVersion = await pieceEngineUtil.lockPieceInFlowVersion({
            engineToken,
            stepName: operation.flowVersion.trigger.name,
            flowVersion: operation.flowVersion,
        })
        const input: ExecuteTriggerOperation<TriggerHookType> = {
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            triggerPayload: operation.triggerPayload,
            flowVersion: lockedVersion,
            appWebhookUrl: await webhookUtils.getAppWebhookUrl({
                appName: triggerPiece.pieceName,
            }),
            serverUrl: await networkUtls.getApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(lockedVersion),
            engineToken,
        }
        await prepareSandbox([triggerPiece], [])
        return execute(input, EngineOperationType.EXECUTE_TRIGGER_HOOK)
    },
    async extractPieceMetadata(operation) {
        logger.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')

        await prepareSandbox([operation], [])

        return execute(operation, EngineOperationType.EXTRACT_PIECE_METADATA)
    },
    async executeValidateAuth(engineToken, operation) {
        logger.debug({ operation }, '[threadEngineRunner#executeValidateAuth]')

        const { piece } = operation
        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        await prepareSandbox([lockedPiece], [])
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken,
        }
        return execute(input, EngineOperationType.EXECUTE_VALIDATE_AUTH)
    },
    async executeAction(engineToken, operation) {
        logger.debug({
            stepName: operation.stepName,
            flowVersion: operation.flowVersion,
        }, '[threadEngineRunner#executeAction]')

        const step = flowHelper.getStep(operation.flowVersion, operation.stepName) as (Action | undefined)
        assertNotNullOrUndefined(step, 'Step not found')
        switch (step.type) {
            case ActionType.PIECE: {
                const lockedPiece = await pieceEngineUtil.getExactPieceForStep(engineToken, step)
                await prepareSandbox([lockedPiece], [])
                break
            }
            case ActionType.CODE: {
                const codes = pieceEngineUtil.getCodeSteps(operation.flowVersion).filter((code) => code.name === operation.stepName)
                await prepareSandbox([], codes)
                break
            }
            case ActionType.BRANCH:
            case ActionType.LOOP_ON_ITEMS:
                break
        }

        const lockedFlowVersion = await pieceEngineUtil.lockPieceInFlowVersion({
            engineToken,
            flowVersion: operation.flowVersion,
            stepName: operation.stepName,
        })

        const input: ExecuteStepOperation = {
            flowVersion: lockedFlowVersion,
            stepName: operation.stepName,
            projectId: operation.projectId,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken,
        }

        return execute(input, EngineOperationType.EXECUTE_STEP)
    },
    async executeProp(engineToken, operation) {
        logger.debug({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.stepName,
            flowVersion: operation.flowVersion,
        }, '[threadEngineRunner#executeProp]')

        const { piece } = operation

        const lockedPiece = await pieceEngineUtil.getExactPieceVersion(engineToken, piece)
        await prepareSandbox([lockedPiece], [])

        const input: ExecutePropsOptions = {
            ...operation,
            serverUrl: await networkUtls.getApiUrl(),
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
    const codes = pieceEngineUtil.getCodeSteps(flowVersion)
    await prepareSandbox(pieces, codes)
}

async function execute<Result extends EngineHelperResult>(operation: EngineOperation, operationType: EngineOperationType): Promise<EngineHelperResponse<Result>> {
    const startTime = Date.now()
    const { engine, stdError, stdOut } = await executeOperation(
        operationType,
        operation,
    )
    return engineRunnerUtils.readResults({
        timeInSeconds: (Date.now() - startTime) / 1000,
        verdict: engine.status,
        output: engine.response,
        standardOutput: stdOut,
        standardError: stdError,
    })
}

async function prepareSandbox(pieces: PiecePackage[], codeSteps: CodeArtifact[]): Promise<void> {
    await mkdir(sandboxPath, { recursive: true })
    const buildJobs = codeSteps
        .map(async (archive) => {
            const indexPath = path.join(codeBuilder.buildPath({
                buildPath: sandboxPath,
                sourceCodeId: archive.name,
                flowVersionId: archive.flowVersionId,
            }), 'index.js')
            const fExists = await fileExists(indexPath)
            if (fExists && archive.flowVersionState === FlowVersionState.LOCKED) {
                return new Promise<void>((resolve) => resolve())
            }
            return codeBuilder.processCodeStep({
                sourceCodeId: archive.name,
                sourceCode: archive.sourceCode,
                flowVersionId: archive.flowVersionId,
                buildPath: sandboxPath,
            })
        })
    await Promise.all(buildJobs)

    logger.info({
        sandboxPath,
    }, 'Running flow in sandbox')
    await packageManager.init({
        path: sandboxPath,
    })


    const installationTimestamp = dayjs().valueOf()
    await pieceManager.install({
        projectPath: sandboxPath,
        pieces,
    })
    logger.info({
        timeTook: dayjs().valueOf() - installationTimestamp,
        pieces,
        sandboxPath,
    }, 'Installing pieces in sandbox')

    logger.info({
        path: sandboxPath,
    }, 'Installing engine in sandbox')
    await engineInstaller.install({
        path: sandboxPath,
    })

}


async function executeOperation(
    operationType: EngineOperationType,
    operation: EngineOperation): Promise<WorkerResult> {
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
    return engineWorkers.executeTask(operationType, operation)
}



function getEnvironmentVariables() {
    const allowedEnvVariables = system.getList(SystemProp.SANDBOX_PROPAGATED_ENV_VARS)
    const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
    return {
        ...propagatedEnvVars,
        NODE_OPTIONS: '--enable-source-maps',
        AP_CODE_SANDBOX_TYPE: system.get(SystemProp.CODE_SANDBOX_TYPE),
        AP_PIECES_SOURCE: system.getOrThrow(SystemProp.PIECES_SOURCE),
        AP_BASE_CODE_DIRECTORY: `${sandboxPath}/codes`,
    }
}