import {
    ActionType,
    ActivepiecesError,
    assertNotNullOrUndefined,
    CodeActionSettings,
    ErrorCode,
    ExecuteFlowOperation,
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
    FlowVersionState,
    PiecePackage,
    ProjectId,
    RunEnvironment,
    StepOutputStatus,
    TriggerType,
} from '@activepieces/shared'
import { Sandbox } from '../sandbox'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { fileService } from '../../file/file.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { OneTimeJobData } from './job-data'
import { engineHelper } from '../../helper/engine-helper'
import { captureException, logger } from '../../helper/logger'
import { isNil } from '@activepieces/shared'
import { getServerUrl } from '../../helper/public-ip-utils'
import { MAX_LOG_SIZE } from '@activepieces/shared'
import { acquireLock } from '../../helper/lock'
import { sandboxProvisioner } from '../sandbox/provisioner/sandbox-provisioner'
import { SandBoxCacheType } from '../sandbox/provisioner/sandbox-cache-key'
import { flowWorkerHooks } from './flow-worker-hooks'
import { logSerializer } from '../../flows/common/log-serializer'

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
    input: ExecuteFlowOperation
    logFileId?: FileId | undefined
}

const extractFlowPieces = async ({ flowVersion, projectId }: ExtractFlowPiecesParams): Promise<PiecePackage[]> => {
    const pieces: PiecePackage[] = []
    const steps = flowHelper.getAllSteps(flowVersion.trigger)

    for (const step of steps) {
        if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
            const { packageType, pieceType, pieceName, pieceVersion } = step.settings
            pieces.push({
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
                projectId,
            })
        }
    }

    return pieces
}

const finishExecution = async (params: FinishExecutionParams): Promise<void> => {
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
            status: executionOutput.status,
            tasks: executionOutput.tasks,
            logsFileId: logFileId,
            tags: executionOutput.tags ?? [],
        })
    }
}

const loadInputAndLogFileId = async ({
    flowVersion,
    jobData,
}: LoadInputAndLogFileIdParams): Promise<LoadInputAndLogFileIdResponse> => {
    const baseInput = {
        flowVersion,
        flowRunId: jobData.runId,
        projectId: jobData.projectId,
        triggerPayload: {
            duration: 0,
            input: {},
            output: jobData.payload,
            status: StepOutputStatus.SUCCEEDED,
        },
    }

    if (jobData.executionType === ExecutionType.BEGIN) {
        return {
            input: {
                serverUrl: await getServerUrl(),
                executionType: ExecutionType.BEGIN,
                ...baseInput,
            },
        }
    }

    const flowRun = await flowRunService.getOneOrThrow({
        id: jobData.runId,
        projectId: jobData.projectId,
    })

    if (isNil(flowRun.pauseMetadata) || isNil(flowRun.logsFileId)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `flowRunId=${flowRun.id}`,
            },
        })
    }

    const logFile = await fileService.getOneOrThrow({
        fileId: flowRun.logsFileId,
        projectId: jobData.projectId,
    })

    const serializedExecutionOutput = logFile.data.toString('utf-8')
    const executionOutput = JSON.parse(
        serializedExecutionOutput,
    ) as ExecutionOutput

    return {
        input: {
            serverUrl: await getServerUrl(),
            executionType: ExecutionType.RESUME,
            executionState: executionOutput.executionState,
            resumeStepMetadata: flowRun.pauseMetadata.resumeStepMetadata,
            resumePayload: jobData.payload,
            ...baseInput,
        },
        logFileId: logFile.id,
    }
}

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
    logger.info(`[FlowWorker#executeFlow] flowRunId=${jobData.runId} executionType=${jobData.executionType}`)

    const startTime = Date.now()

    const flowVersionWithLockedPieces = await flowVersionService.getOne(jobData.flowVersionId)

    if (isNil(flowVersionWithLockedPieces)) {
        logger.info({
            message: 'Flow version not found, skipping execution',
            flowVersionId: jobData.flowVersionId,
        })
        return
    }
    const flowVersion = await flowVersionService.lockPieceVersions(
        jobData.projectId,
        flowVersionWithLockedPieces,
    )

    await flowWorkerHooks.getHooks().preExecute({ projectId: jobData.projectId, runId: jobData.runId })

    const sandbox = await getSandbox({
        projectId: jobData.projectId,
        flowVersion,
        runEnvironment: jobData.environment,
    })

    logger.info(`[FlowWorker#executeFlow] flowRunId=${jobData.runId} sandboxId=${sandbox.boxId} prepareTime=${Date.now() - startTime}ms`)

    try {

        const { input, logFileId } = await loadInputAndLogFileId({
            flowVersion,
            jobData,
        })

        const { result: executionOutput } = await engineHelper.executeFlow(
            sandbox,
            input,
        )


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

        logger.info(
            `[FlowWorker#executeFlow] flowRunId=${jobData.runId
            } executionOutputStats=${executionOutput.status} sandboxId=${sandbox.boxId
            } duration=${Date.now() - startTime} ms`,
        )
    }
    catch (e: unknown) {
        if (e instanceof ActivepiecesError && (e as ActivepiecesError).error.code === ErrorCode.QUOTA_EXCEEDED) {
            await flowRunService.finish({ flowRunId: jobData.runId, status: ExecutionOutputStatus.QUOTA_EXCEEDED, tasks: 0, logsFileId: null, tags: [] })
        }
        else if (e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT) {
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
    finally {
        await sandboxProvisioner.release({ sandbox })
    }
}

function throwErrorToRetry(error: Error, runId: string): void {
    captureException(error)
    logger.error(error, '[FlowWorker#executeFlow] Error executing flow run id' + runId)
    throw error
}

async function saveToLogFile({ fileId, projectId, executionOutput }: { fileId: FileId | undefined, projectId: ProjectId, executionOutput: ExecutionOutput }): Promise<File> {
    const serializedLogs = await logSerializer.serialize(executionOutput)

    if (serializedLogs.byteLength > MAX_LOG_SIZE) {
        const errors = new Error('Execution Output is too large, maximum size is ' + MAX_LOG_SIZE)
        captureException(errors)
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

async function getCodeSteps(projectId: ProjectId, flowVersion: FlowVersion): Promise<{ sourceId: string, zipFile: Buffer }[]> {
    switch (flowVersion.state) {
        case FlowVersionState.DRAFT:
            return getCodeStepsWithLock(projectId, flowVersion)
        case FlowVersionState.LOCKED:
            return getCodeStepsWithoutLock(projectId, flowVersion)
    }
}

async function getCodeStepsWithLock(projectId: ProjectId, flowVersion: FlowVersion): Promise<{ sourceId: string, zipFile: Buffer }[]> {
    const flowLock = await acquireLock({
        key: flowVersion.id,
        timeout: 180000,
    })
    try {
        return getCodeStepsWithoutLock(projectId, flowVersion)
    }
    finally {
        await flowLock.release()
    }
}

async function getCodeStepsWithoutLock(projectId: ProjectId, flowVersion: FlowVersion): Promise<{ sourceId: string, zipFile: Buffer }[]> {
    const steps = flowHelper.getAllSteps(flowVersion.trigger).filter((step) => step.type === ActionType.CODE)
    const promises = []

    for (const step of steps) {
        const codeSettings = step.settings as CodeActionSettings
        if (isNil(codeSettings.artifactSourceId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Missing artifactSourceId for code step ${flowVersion.id}`,
                },
            })
        }
        const promise = fileService.getOneOrThrow({
            fileId: codeSettings.artifactSourceId,
            projectId,
        })
        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results.map((sourceEntity, index) => {
        const step = steps[index]
        const codeSettings = step.settings as CodeActionSettings

        assertNotNullOrUndefined(codeSettings.artifactSourceId, '[FlowWorker#getCodeSteps] codeSettings.artifactSourceId')

        return {
            sourceId: codeSettings.artifactSourceId,
            zipFile: sourceEntity.data,
        }
    })
}

const getSandbox = async ({ projectId, flowVersion, runEnvironment }: GetSandboxParams): Promise<Sandbox> => {
    const pieces = await extractFlowPieces({
        flowVersion,
        projectId,
    })

    const codeSteps = await getCodeSteps(projectId, flowVersion)
    const codeArchives = codeSteps.map((step) => ({
        id: step.sourceId,
        content: step.zipFile,
    }))

    switch (runEnvironment) {
        case RunEnvironment.PRODUCTION:
            return await sandboxProvisioner.provision({
                type: SandBoxCacheType.FLOW,
                flowVersionId: flowVersion.id,
                pieces,
                codeArchives,
            })
        case RunEnvironment.TESTING:
            return await sandboxProvisioner.provision({
                type: SandBoxCacheType.NONE,
                pieces,
                codeArchives,
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
