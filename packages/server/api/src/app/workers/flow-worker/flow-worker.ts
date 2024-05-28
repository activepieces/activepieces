import { tasksLimit } from '../../ee/project-plan/tasks-limit'
import {
    flowRunService,
} from '../../flows/flow-run/flow-run-service'
import { engineHelper, generateWorkerToken } from '../../helper/engine-helper'
import { getPiecePackage } from '../../pieces/piece-metadata-service'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import {
    Action, ActionType,
    ActivepiecesError,
    assertNotNullOrUndefined,
    BeginExecuteFlowOperation,
    CodeAction,
    ErrorCode,
    ExecutionType,
    FileId,
    flowHelper,
    FlowRunStatus,
    FlowVersion,
    isNil,
    PiecePackage,
    ProjectId,
    ResumeExecuteFlowOperation,
    ResumePayload,
    RunEnvironment,
    SourceCode,
    Trigger,
    TriggerType,
} from '@activepieces/shared'
import { OneTimeJobData, Sandbox, SandBoxCacheType, sandboxProvisioner, serverApiService } from 'server-worker'

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



const loadInputAndLogFileId = async ({
    flowVersion,
    jobData,
}: LoadInputAndLogFileIdParams): Promise<LoadInputAndLogFileIdResponse> => {
    const baseInput = {
        flowVersion,
        flowRunId: jobData.runId,
        projectId: jobData.projectId,
        serverHandlerId: jobData.synchronousHandlerId,
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
                    runEnvironment: jobData.environment,
                    resumePayload: jobData.payload as ResumePayload,
                    progressUpdateType: jobData.progressUpdateType,
                },
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
                    runEnvironment: jobData.environment,
                    progressUpdateType: jobData.progressUpdateType,
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
    const workerToken = await generateWorkerToken({
        projectId: jobData.projectId,
    })
    const serverApi = serverApiService(workerToken)
    const flow = await serverApi.getFlowWithExactPieces(jobData.flowVersionId)
    if (isNil(flow)) {
        logger.info({
            message: 'Flow version not found, skipping execution',
            flowVersionId: jobData.flowVersionId,
        })
        return
    }
    
    try {
        await tasksLimit.limit({
            projectId: jobData.projectId,
        })
        const { input } = await loadInputAndLogFileId({
            flowVersion: flow.version,
            jobData,
        })

        const sandbox = await getSandbox({
            projectId: jobData.projectId,
            flowVersion: flow.version,
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
            await serverApiService(workerToken).updateRunStatus({
                runDetails: {
                    steps: {},
                    duration: 0,
                    status: FlowRunStatus.QUOTA_EXCEEDED,
                    tasks: 0,
                    tags: [],
                },
                progressUpdateType: jobData.progressUpdateType,
                workerHandlerId: jobData.synchronousHandlerId,
                runId: jobData.runId,
            })

        }
        else if (
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.EXECUTION_TIMEOUT
        ) {
            await serverApiService(workerToken).updateRunStatus({
                runDetails: {
                    steps: {},
                    duration: 0,
                    status: FlowRunStatus.TIMEOUT,
                    // TODO REVISIT THIS
                    tasks: 10,
                    tags: [],
                },
                progressUpdateType: jobData.progressUpdateType,
                workerHandlerId: jobData.synchronousHandlerId,
                runId: jobData.runId,
            })

        }
        else {
            await serverApiService(workerToken).updateRunStatus({
                runDetails: {
                    steps: {},
                    duration: 0,
                    status: FlowRunStatus.INTERNAL_ERROR,
                    tasks: 0,
                    tags: [],
                },
                progressUpdateType: jobData.progressUpdateType,
                workerHandlerId: jobData.synchronousHandlerId,
                runId: jobData.runId,
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

