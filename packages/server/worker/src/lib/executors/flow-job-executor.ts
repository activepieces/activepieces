import { exceptionHandler, OneTimeJobData } from '@activepieces/server-shared'
import { ActionType, ActivepiecesError, BeginExecuteFlowOperation, CodeAction, ErrorCode, ExecutionType, flowHelper, FlowRunStatus, FlowVersion, GetFlowVersionForWorkerRequestType, isNil, PackageType, PiecePackage, PrivatePiecePackage, ProjectId, PublicPiecePackage, RunEnvironment, SourceCode, TriggerType } from '@activepieces/shared'
import { engineApiService } from '../api/server-api.service'
import { engineRunner } from '../engine/engine-runner'
import { Sandbox } from '../sandbox'
import { SandBoxCacheType } from '../sandbox/provisioner/sandbox-cache-key'
import { sandboxProvisioner } from '../sandbox/provisioner/sandbox-provisioner'


async function executeFlow(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    try {
        const flow = await engineApiService(engineToken).getFlowWithExactPieces({
            versionId: jobData.flowVersionId,
            type: GetFlowVersionForWorkerRequestType.EXACT,
        })
        if (isNil(flow)) {
            return
        }

        const sandbox = await prepareSandbox({
            projectId: jobData.projectId,
            flowVersion: flow.version,
            runEnvironment: jobData.environment,
        })

        // TODO URGENT FIX FOR RESUME TRIGGER
        const input: Omit<BeginExecuteFlowOperation, 'serverUrl' | 'engineToken'> = {
            flowVersion: flow.version,
            flowRunId: jobData.runId,
            projectId: jobData.projectId,
            serverHandlerId: jobData.synchronousHandlerId,
            triggerPayload: jobData.payload,
            executionType: ExecutionType.BEGIN,
            runEnvironment: jobData.environment,
            progressUpdateType: jobData.progressUpdateType,
        }

        const { result } = await engineRunner.executeFlow(
            engineToken,
            sandbox,
            input,
        )

        if (result.status === FlowRunStatus.INTERNAL_ERROR) {
            await handleInternalError(jobData, engineToken, new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: {
                    message: result.error?.message ?? 'internal error',
                },
            }))
        }

    }
    catch (e) {
        const isQuotaExceededError = e instanceof ActivepiecesError && e.error.code === ErrorCode.QUOTA_EXCEEDED
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isQuotaExceededError) {
            await handleQuotaExceededError(jobData, engineToken)
        }
        else if (isTimeoutError) {
            await handleTimeoutError(jobData, engineToken)
        }
        else {
            await handleInternalError(jobData, engineToken, e as Error)
        }
    }
}

async function handleQuotaExceededError(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
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
async function handleTimeoutError(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            steps: {},
            duration: 0,
            status: FlowRunStatus.TIMEOUT,
            tasks: 0,
            tags: [],
        },
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}

async function handleInternalError(jobData: OneTimeJobData, engineToken: string, e: Error): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
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
    throwErrorToRetry(e as Error)
}

function throwErrorToRetry(error: Error): void {
    exceptionHandler.handle(error)
    throw error
}

function getCodeSteps(flowVersion: FlowVersion): { name: string, sourceCode: SourceCode }[] {
    const steps = flowHelper.getAllSteps(flowVersion.trigger)
    return steps.filter((step) => step.type === ActionType.CODE).map((step) => {
        const codeAction = step as CodeAction
        return {
            name: codeAction.name,
            sourceCode: codeAction.settings.sourceCode,
        }
    })
}

async function prepareSandbox({
    projectId,
    flowVersion,
    runEnvironment,
}: GetSandboxParams): Promise<Sandbox> {
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

const extractFlowPieces = async ({
    projectId,
    flowVersion,
}: ExtractFlowPiecesParams): Promise<PiecePackage[]> => {
    const pieces: PiecePackage[] = []
    const steps = flowHelper.getAllSteps(flowVersion.trigger)

    for (const step of steps) {
        if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
            const { packageType, pieceType, pieceName, pieceVersion } = step.settings
            const piecePackage = await getPiecePackage(projectId, {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
            })
            pieces.push(piecePackage)
        }
    }

    return pieces
}


export const getPiecePackage = async (
    projectId: string,
    pkg: PublicPiecePackage | Omit<PrivatePiecePackage, 'archiveId' | 'archive'>,
): Promise<PiecePackage> => {
    switch (pkg.packageType) {
        case PackageType.ARCHIVE: {
            // TODO URGENT FIX
            throw new Error('Not implemented')
        }
        case PackageType.REGISTRY: {
            return pkg
        }
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

export const flowJobExecutor = {
    executeFlow,
}