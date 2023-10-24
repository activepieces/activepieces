import {
    ActionType,
    ActivepiecesError,
    CodeAction,
    StepRunResponse,
    ErrorCode,
    ExecuteActionOperation,
    flowHelper,
    FlowVersion,
    FlowVersionId,
    PieceAction,
    ProjectId,
    Action,
    BranchAction,
    EmptyTrigger,
    TriggerType,
    apId,
    ExecutionType,
    EngineResponseStatus,
    ExecutionState,
    BranchStepOutput,
    ExecutionOutputStatus,
    UserId,
    FlowOperationType,
    EngineTestOperation,
    StepOutputStatus,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import { isNil } from '@activepieces/shared'
import { getServerUrl } from '../../helper/public-ip-utils'
import { flowService } from '../flow/flow.service'
import { stepFileService } from '../step-file/step-file.service'
import { sandboxProvisioner } from '../../workers/sandbox/provisioner/sandbox-provisioner'
import { SandBoxCacheType } from '../../workers/sandbox/provisioner/sandbox-cache-key'

export const stepRunService = {
    async create({ projectId, flowVersionId, stepName, userId }: CreateParams): Promise<StepRunResponse> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName,
                },
            })
        }

        switch (step.type) {
            case ActionType.PIECE: {
                return executePiece({ step, flowVersion, projectId, userId })
            }
            case ActionType.CODE: {
                return executeCode({ step, flowVersion, projectId, userId })
            }
            case ActionType.BRANCH: {
                return executeBranch({ step, flowVersion, projectId, userId })
            }
            default: {
                return {
                    success: false,
                    output: 'step not testable',
                    standardError: '',
                    standardOutput: '',
                }
            }
        }
    },
}

async function executePiece({ step, projectId, flowVersion, userId }: ExecuteParams<PieceAction>): Promise<StepRunResponse> {
    const { packageType, pieceType, pieceName, pieceVersion, actionName, input } = step.settings

    if (isNil(actionName)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'actionName is undefined',
            },
        })
    }

    await stepFileService.deleteAll({
        projectId,
        flowId: flowVersion.flowId,
        stepName: step.name,
    })

    const operation: ExecuteActionOperation = {
        serverUrl: await getServerUrl(),
        piece: {
            packageType,
            pieceType,
            pieceName,
            pieceVersion,
            projectId,
        },
        actionName,
        input,
        flowVersion,
        projectId,
    }

    const { result, standardError, standardOutput } = await engineHelper.executeAction(operation)

    if (result.success) {
        step.settings.inputUiInfo.currentSelectedData = result.output
        await flowService.update({
            userId,
            flowId: flowVersion.flowId,
            projectId,
            request: {
                type: FlowOperationType.UPDATE_ACTION,
                request: step,
            },
        })
    }
    return {
        success: result.success,
        output: result.output,
        standardError,
        standardOutput,
    }
}

async function executeCode({ step, flowVersion, projectId }: ExecuteParams<CodeAction>): Promise<StepRunResponse> {

    const { result, standardError, standardOutput } = await engineHelper.executeCode({
        step,
        input: step.settings.input,
        serverUrl: await getServerUrl(),
        flowVersion,
        projectId,
    })
    return {
        success: result.success,
        output: result.output,
        standardError,
        standardOutput,
    }
}

const executeBranch = async ({ step, flowVersion, projectId }: ExecuteParams<BranchAction>): Promise<StepRunResponse> => {
    const branchStep = flowHelper.getStep(flowVersion, step.name)

    if (isNil(branchStep) || branchStep.type !== ActionType.BRANCH) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: step.name,
            },
        })
    }

    const testTrigger: EmptyTrigger = {
        name: 'test_trigger',
        valid: true,
        displayName: 'test branch step',
        nextAction: {
            ...branchStep,
            nextAction: undefined,
            onSuccessAction: undefined,
            onFailureAction: undefined,
        },
        type: TriggerType.EMPTY,
        settings: {},
    }

    const testFlowVersion: FlowVersion = {
        ...flowVersion,
        trigger: testTrigger,
    }

    const testInput: EngineTestOperation = {
        executionType: ExecutionType.BEGIN,
        flowRunId: apId(),
        flowVersion: testFlowVersion,
        projectId,
        serverUrl: await getServerUrl(),
        triggerPayload: {
            duration: 0,
            input: {},
            output: flowVersion.trigger.settings?.inputUiInfo?.currentSelectedData,
            status: StepOutputStatus.SUCCEEDED,
        },
        sourceFlowVersion: flowVersion,
    }

    const sandbox = await sandboxProvisioner.provision({
        type: SandBoxCacheType.NONE,
    })

    try {
        const { status, result, standardError, standardOutput } = await engineHelper.executeTest(sandbox, testInput)

        if (status !== EngineResponseStatus.OK || result.status !== ExecutionOutputStatus.SUCCEEDED) {
            return {
                success: false,
                output: null,
                standardError,
                standardOutput,
            }
        }

        const branchStepOutput = new ExecutionState(result.executionState).getStepOutput<BranchStepOutput>({
            stepName: branchStep.name,
            ancestors: [],
        })

        if (isNil(branchStepOutput)) {
            return {
                success: false,
                output: null,
                standardError,
                standardOutput,
            }
        }

        return {
            success: true,
            output: branchStepOutput.output,
            standardError,
            standardOutput,
        }
    }
    finally {
        await sandboxProvisioner.release({ sandbox })
    }
}

type CreateParams = {
    userId: UserId
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}

type ExecuteParams<T extends Action> = {
    step: T
    userId: UserId
    flowVersion: FlowVersion
    projectId: ProjectId
}
