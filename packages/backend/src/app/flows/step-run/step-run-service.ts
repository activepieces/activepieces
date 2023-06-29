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
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import { fileService } from '../../file/file.service'
import { codeBuilder } from '../../workers/code-worker/code-builder'
import { isNil } from '@activepieces/shared'

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}


export const stepRunService = {
    async create({ projectId, flowVersionId, stepName }: CreateParams): Promise<StepRunResponse> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step) || (step.type !== ActionType.PIECE && step.type !== ActionType.CODE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `invalid stepName (${stepName})`,
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
        }
    },
}

async function executePiece({ step, projectId, flowVersion }: {
    step: PieceAction, projectId: ProjectId, flowVersion: FlowVersion
}): Promise<StepRunResponse> {
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
        pieceName,
        pieceVersion,
        actionName,
        flowVersion,
        input,
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
        standardError: standardError,
        standardOutput: standardOutput,
    }
}

async function executeCode({ step, flowVersion, projectId }: { step: CodeAction, flowVersion: FlowVersion, projectId: ProjectId }): Promise<StepRunResponse> {
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
        standardError: standardError,
        standardOutput: standardOutput,
    }
}
