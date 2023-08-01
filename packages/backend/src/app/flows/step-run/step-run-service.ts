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
    ExecuteFlowOperation,
    ExecutionType,
    EngineResponseStatus,
    ExecutionState,
    BranchStepOutput,
    ExecutionOutputStatus,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import { fileService } from '../../file/file.service'
import { codeBuilder } from '../../workers/code-worker/code-builder'
import { isNil } from '@activepieces/shared'
import { getServerUrl } from '../../helper/public-ip-utils'
import { sandboxManager } from '../../workers/sandbox'

export const stepRunService = {
    async create({ projectId, flowVersionId, stepName }: CreateParams): Promise<StepRunResponse> {
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
                return await executePiece({ step, flowVersion, projectId })
            }
            case ActionType.CODE: {
                return await executeCode({ step, flowVersion, projectId })
            }
            case ActionType.BRANCH: {
                return await executeBranch({ step, flowVersion, projectId })
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

async function executePiece({ step, projectId, flowVersion }: ExecuteParams<PieceAction>): Promise<StepRunResponse> {
    const { pieceName, pieceVersion, actionName, input } = step.settings

    if (isNil(actionName)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'actionName is undefined',
            },
        })
    }

    const operation: ExecuteActionOperation = {
        serverUrl: await getServerUrl(),
        pieceName,
        pieceVersion,
        actionName,
        input,
        flowVersion,
        projectId,
    }

    const { result, standardError, standardOutput } = await engineHelper.executeAction(operation)
    if (result.success) {
        step.settings.inputUiInfo.currentSelectedData = result.output
        await flowVersionService.overwriteVersion(flowVersion.id, flowVersion)
    }
    return {
        success: result.success,
        output: result.output,
        standardError,
        standardOutput,
    }
}

async function executeCode({ step, flowVersion, projectId }: ExecuteParams<CodeAction>): Promise<StepRunResponse> {
    const file = await fileService.getOneOrThrow({
        projectId,
        fileId: step.settings.artifactSourceId!,
    })
    const bundledCode = await codeBuilder.build(file.data)

    const { result, standardError, standardOutput } = await engineHelper.executeCode({
        codeBase64: bundledCode.toString('base64'),
        input: step.settings.input,
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

    delete branchStep.nextAction
    delete branchStep.onFailureAction
    delete branchStep.onSuccessAction

    const testTrigger: EmptyTrigger = {
        name: 'test_branch_step',
        valid: true,
        displayName: 'test branch step',
        nextAction: branchStep,
        type: TriggerType.EMPTY,
        settings: {},
    }

    flowVersion.trigger = testTrigger

    const testInput: ExecuteFlowOperation = {
        executionType: ExecutionType.BEGIN,
        flowRunId: apId(),
        flowVersion,
        projectId,
        serverUrl: await getServerUrl(),
        triggerPayload: {},
    }

    const testSandbox = await sandboxManager.obtainSandbox(apId())

    const { status, result, standardError, standardOutput } = await engineHelper.executeFlow(testSandbox, testInput)

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

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}

type ExecuteParams<T extends Action> = {
    step: T
    flowVersion: FlowVersion
    projectId: ProjectId
}
