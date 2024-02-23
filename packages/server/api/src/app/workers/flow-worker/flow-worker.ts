import {
    Action,
    ActionType,
    ActivepiecesError,
    assertNotNullOrUndefined,
    BeginExecuteFlowOperation,
    CodeAction,
    ErrorCode,
    ExecutionOutput,
    ExecutionOutputStatus,
    ExecutionType,
    File,
    FileCompression,
    FileId,
    FileType,
    flowHelper,
    FlowRunId,
    FlowVersion,
    PiecePackage,
    ProjectId,
    ResumeExecuteFlowOperation,
    ResumePayload,
    RunEnvironment,
    RunTerminationReason,
    SourceCode,
    Trigger,
    TriggerType,
} from '@activepieces/shared'
import { Sandbox } from 'server-worker'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { fileService } from '../../file/file.service'
import {
    flowRunService,
    HookType,
} from '../../flows/flow-run/flow-run-service'
import { OneTimeJobData } from './job-data'
import { engineHelper } from '../../helper/engine-helper'
import { isNil } from '@activepieces/shared'
import { MAX_LOG_SIZE } from '@activepieces/shared'
import { sandboxProvisioner } from '../sandbox/provisioner/sandbox-provisioner'
import { SandBoxCacheType } from '../sandbox/provisioner/sandbox-cache-key'
import { flowWorkerHooks } from './flow-worker-hooks'
import { flowResponseWatcher } from '../../flows/flow-run/flow-response-watcher'
import { getPiecePackage } from '../../pieces/piece-metadata-service'
import { exceptionHandler, logger } from 'server-shared'
import { logSerializer } from 'server-worker'

type FinishExecutionParams = {
    flowRunId: FlowRunId
    logFileId: FileId
    executionOutput: ExecutionOutput
}

type LoadInputAndLogFileIdParams = {
    flowVersion: FlowVersion
    jobData: OneTimeJobData
}

type LoadInputAndLogFileIdResponse = {
    input:
    | Omit<BeginExecuteFlowOperation, 'serverUrl' | 'workerToken'>
    | Omit<ResumeExecuteFlowOperation, 'serverUrl' | 'workerToken'>
    logFileId?: FileId | undefined
}

const extractFlowPieces = async ({
    projectId,
    flowVersion,
}: ExtractFlowPiecesParams): Promise<PiecePackage[]> => {
    const pieces: PiecePackage[] = []
    const steps = flowHelper.getAllSteps(flowVersion.trigger)

    for (const step of steps) {
        if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
            const { packageType, pieceType, pieceName, pieceVersion } = step.settings
            pieces.push(
                await getPiecePackage(projectId, {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion,
                }),
            )
        }
    }

    return pieces
}

const finishExecution = async (
    params: FinishExecutionParams,
): Promise<void> => {
    logger.trace(params, '[FlowWorker#finishExecution] params')

    const { flowRunId, logFileId, executionOutput } = params

    if (executionOutput.status === ExecutionOutputStatus.PAUSED) {
        await flowRunService.pause({
            flowRunId,
            logFileId,
            pauseMetadata: executionOutput.pauseMetadata,
        })
    }
    else {
        await flowRunService.finish({
            flowRunId,
            status: getTerminalStatus(executionOutput.status),
            terminationReason: getTerminationReason(executionOutput),
            tasks: executionOutput.tasks,
            logsFileId: logFileId,
            tags: executionOutput.tags ?? [],
        })
    }
}

const getTerminalStatus = (
    executionOutputStatus: ExecutionOutputStatus,
): ExecutionOutputStatus => {
    return executionOutputStatus == ExecutionOutputStatus.STOPPED
        ? ExecutionOutputStatus.SUCCEEDED
        : executionOutputStatus
}

const getTerminationReason = (
    executionOutput: ExecutionOutput,
): RunTerminationReason | undefined => {
    if (executionOutput.status === ExecutionOutputStatus.STOPPED) {
        return RunTerminationReason.STOPPED_BY_HOOK
    }
    return undefined
}

const loadInputAndLogFileId = async ({
    flowVersion,
    jobData,
}: LoadInputAndLogFileIdParams): Promise<LoadInputAndLogFileIdResponse> => {
    const baseInput = {
        flowVersion,
        flowRunId: jobData.runId,
        projectId: jobData.projectId,
    }

    const flowRun = await flowRunService.getOneOrThrow({
        id: jobData.runId,
        projectId: jobData.projectId,
    })

    switch (jobData.executionType) {
        case ExecutionType.RESUME: {
            if (isNil(flowRun.logsFileId)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `flowRunId=${flowRun.id}`,
                    },
                })
            }

            const executionOutput = await loadPayload({
                logsFileId: flowRun.logsFileId,
                projectId: jobData.projectId,
            })

            return {
                input: {
                    ...baseInput,
                    executionType: ExecutionType.RESUME,
                    tasks: executionOutput.tasks,
                    executionState: executionOutput.executionState,
                    resumePayload: jobData.payload as ResumePayload,
                },
                logFileId: flowRun.logsFileId,
            }
        }
        case ExecutionType.BEGIN:
            if (!isNil(flowRun.logsFileId)) {
                const executionOutput = await loadPayload({
                    logsFileId: flowRun.logsFileId,
                    projectId: jobData.projectId,
                })
                if (executionOutput.status !== ExecutionOutputStatus.INTERNAL_ERROR) {
                    const trigger = Object.values(
                        executionOutput.executionState.steps,
                    ).find((step) => flowHelper.isTrigger(step.type))
                    assertNotNullOrUndefined(
                        trigger,
                        'Trigger not found in execution state',
                    )
                    jobData.payload = trigger.output
                }
            }
            return {
                input: {
                    triggerPayload: jobData.payload,
                    executionType: ExecutionType.BEGIN,
                    ...baseInput,
                },
            }
    }
}

async function loadPayload({
    logsFileId,
    projectId,
}: {
    logsFileId: string
    projectId: string
}): Promise<ExecutionOutput> {
    const logFile = await fileService.getOneOrThrow({
        fileId: logsFileId,
        projectId,
    })

    const serializedExecutionOutput = logFile.data.toString('utf-8')
    const executionOutput: ExecutionOutput = JSON.parse(
        serializedExecutionOutput,
    )
    return executionOutput
}

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
    logger.info(
        `[FlowWorker#executeFlow] flowRunId=${jobData.runId} executionType=${jobData.executionType}`,
    )

    const startTime = Date.now()

    const flowVersionWithLockedPieces = await flowVersionService.getOne(
        jobData.flowVersionId,
    )

    if (isNil(flowVersionWithLockedPieces)) {
        logger.info({
            message: 'Flow version not found, skipping execution',
            flowVersionId: jobData.flowVersionId,
        })
        return
    }
    const flowVersion = await flowVersionService.lockPieceVersions({
        projectId: jobData.projectId,
        flowVersion: flowVersionWithLockedPieces,
    })

    await flowWorkerHooks
        .getHooks()
        .preExecute({ projectId: jobData.projectId, runId: jobData.runId })

    try {
        const { input, logFileId } = await loadInputAndLogFileId({
            flowVersion,
            jobData,
        })

        const sandbox = await getSandbox({
            projectId: jobData.projectId,
            flowVersion,
            runEnvironment: jobData.environment,
        })

        logger.info(
            `[FlowWorker#executeFlow] flowRunId=${jobData.runId} sandboxId=${
                sandbox.boxId
            } prepareTime=${Date.now() - startTime}ms`,
        )

        const { result: executionOutput } = await engineHelper.executeFlow(
            sandbox,
            input,
        )

        if (
            jobData.synchronousHandlerId &&
      jobData.hookType === HookType.BEFORE_LOG
        ) {
            await flowResponseWatcher.publish(
                jobData.runId,
                jobData.synchronousHandlerId,
                executionOutput,
            )
        }

        const logsFile = await saveToLogFile({
            fileId: logFileId,
            projectId: jobData.projectId,
            executionOutput,
        })

        await finishExecution({
            flowRunId: jobData.runId,
            logFileId: logsFile.id,
            executionOutput,
        })

        if (
            jobData.synchronousHandlerId &&
      jobData.hookType === HookType.AFTER_LOG
        ) {
            await flowResponseWatcher.publish(
                jobData.runId,
                jobData.synchronousHandlerId,
                executionOutput,
            )
        }

        logger.info(
            `[FlowWorker#executeFlow] flowRunId=${
                jobData.runId
            } executionOutputStatus=${executionOutput.status} sandboxId=${
                sandbox.boxId
            } duration=${Date.now() - startTime} ms`,
        )
    }
    catch (e: unknown) {
        if (
            e instanceof ActivepiecesError &&
      (e as ActivepiecesError).error.code === ErrorCode.QUOTA_EXCEEDED
        ) {
            await flowRunService.finish({
                flowRunId: jobData.runId,
                status: ExecutionOutputStatus.QUOTA_EXCEEDED,
                tasks: 0,
                logsFileId: null,
                tags: [],
            })
        }
        else if (
            e instanceof ActivepiecesError &&
      e.error.code === ErrorCode.EXECUTION_TIMEOUT
        ) {
            await flowRunService.finish({
                flowRunId: jobData.runId,
                status: ExecutionOutputStatus.TIMEOUT,
                // TODO REVIST THIS
                tasks: 10,
                logsFileId: null,
                tags: [],
            })
        }
        else {
            await flowRunService.finish({
                flowRunId: jobData.runId,
                status: ExecutionOutputStatus.INTERNAL_ERROR,
                tasks: 0,
                logsFileId: null,
                tags: [],
            })
            throwErrorToRetry(e as Error, jobData.runId)
        }
    }
}

function throwErrorToRetry(error: Error, runId: string): void {
    exceptionHandler.handle(error)
    logger.error(
        error,
        '[FlowWorker#executeFlow] Error executing flow run id' + runId,
    )
    throw error
}

async function saveToLogFile({
    fileId,
    projectId,
    executionOutput,
}: {
    fileId: FileId | undefined
    projectId: ProjectId
    executionOutput: ExecutionOutput
}): Promise<File> {
    const serializedLogs = await logSerializer.serialize(executionOutput)

    if (serializedLogs.byteLength > MAX_LOG_SIZE) {
        const errors = new Error(
            'Execution Output is too large, maximum size is ' + MAX_LOG_SIZE,
        )
        exceptionHandler.handle(errors)
        throw errors
    }

    const logsFile = await fileService.save({
        fileId,
        projectId,
        data: serializedLogs,
        type: FileType.FLOW_RUN_LOG,
        compression: FileCompression.GZIP,
    })

    return logsFile
}

function getCodeSteps(
    flowVersion: FlowVersion,
): { name: string, sourceCode: SourceCode }[] {
    return flowHelper
        .getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === ActionType.CODE)
        .map((step: Action | Trigger) => {
            const codeAction = step as CodeAction
            return {
                name: codeAction.name,
                sourceCode: codeAction.settings.sourceCode,
            }
        })
}

const getSandbox = async ({
    projectId,
    flowVersion,
    runEnvironment,
}: GetSandboxParams): Promise<Sandbox> => {
    const pieces = await extractFlowPieces({
        flowVersion,
        projectId,
    })

    const codeSteps = getCodeSteps(flowVersion)
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

type GetSandboxParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    runEnvironment: RunEnvironment
}

type ExtractFlowPiecesParams = {
    flowVersion: FlowVersion
    projectId: ProjectId
}

export const flowWorker = {
    executeFlow,
}
