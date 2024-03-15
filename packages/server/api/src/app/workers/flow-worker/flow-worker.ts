import {
    Action,
    ActionType,
    ActivepiecesError,
    assertNotNullOrUndefined,
    BeginExecuteFlowOperation,
    CodeAction,
    ErrorCode,
    ExecutionType,
    ExecutioOutputFile,
    File,
    FileCompression,
    FileId,
    FileType,
    FlowRunStatus,
    flowHelper,
    FlowRunId,
    FlowVersion,
    PiecePackage,
    ProjectId,
    ResumeExecuteFlowOperation,
    ResumePayload,
    RunEnvironment,
    SourceCode,
    Trigger,
    TriggerType,
    FlowRunResponse,
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
    result: FlowRunResponse
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

    const { flowRunId, logFileId, result } = params

    if (result.status === FlowRunStatus.PAUSED) {
        await flowRunService.pause({
            flowRunId,
            logFileId,
            pauseMetadata: result.pauseMetadata!,
        })
    }
    else {
        await flowRunService.finish({
            flowRunId,
            status: getTerminalStatus(result.status),
            tasks: result.tasks,
            logsFileId: logFileId,
            tags: result.tags ?? [],
        })
    }
}

const getTerminalStatus = (
    status: FlowRunStatus,
): FlowRunStatus => {
    return status == FlowRunStatus.STOPPED
        ? FlowRunStatus.SUCCEEDED
        : status
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

    const flowRun = await flowRunService.getOnePopulatedOrThrow({
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

            return {
                input: {
                    ...baseInput,
                    tasks: flowRun.tasks ?? 0,
                    executionType: ExecutionType.RESUME,
                    steps: flowRun.steps,
                    resumePayload: jobData.payload as ResumePayload,
                },
                logFileId: flowRun.logsFileId,
            }
        }
        case ExecutionType.BEGIN:
            if (!isNil(flowRun.logsFileId)) {
                if (flowRun.status !== FlowRunStatus.INTERNAL_ERROR) {
                    const trigger = Object.values(flowRun.steps).find((step) => flowHelper.isTrigger(step.type))
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
            `[FlowWorker#executeFlow] flowRunId=${jobData.runId} sandboxId=${sandbox.boxId
            } prepareTime=${Date.now() - startTime}ms`,
        )

        const { result } = await engineHelper.executeFlow(
            sandbox,
            input,
        )

        if (result.status === FlowRunStatus.INTERNAL_ERROR) {
            const retryError = new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: {
                    message: result.error?.message ?? 'internal error',
                },
            })

            throwErrorToRetry(retryError, jobData.runId)
        }

        if (
            jobData.synchronousHandlerId &&
            jobData.hookType === HookType.BEFORE_LOG
        ) {
            await flowResponseWatcher.publish(
                jobData.runId,
                jobData.synchronousHandlerId,
                result,
            )
        }

        const logsFile = await saveToLogFile({
            fileId: logFileId,
            projectId: jobData.projectId,
            executionOutput: {
                executionState: {
                    steps: result.steps,
                },
            },
        })

        await finishExecution({
            flowRunId: jobData.runId,
            logFileId: logsFile.id,
            result,
        })

        if (
            jobData.synchronousHandlerId &&
            jobData.hookType === HookType.AFTER_LOG
        ) {
            await flowResponseWatcher.publish(
                jobData.runId,
                jobData.synchronousHandlerId,
                result,
            )
        }

        logger.info(
            `[FlowWorker#executeFlow] flowRunId=${jobData.runId
            } executionOutputStatus=${result.status} sandboxId=${sandbox.boxId
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
                status: FlowRunStatus.QUOTA_EXCEEDED,
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
                status: FlowRunStatus.TIMEOUT,
                // TODO REVIST THIS
                tasks: 10,
                logsFileId: null,
                tags: [],
            })
        }
        else {
            await flowRunService.finish({
                flowRunId: jobData.runId,
                status: FlowRunStatus.INTERNAL_ERROR,
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
    executionOutput: ExecutioOutputFile
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
