import {
    ActionType,
    ActivepiecesError,
    ErrorCode,
    ExecuteActionOperation,
    flowHelper,
    FlowVersion,
    FlowVersionId,
    ProjectId,
    TriggerType,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}

const generateTestExecutionContext = (flowVersion: FlowVersion): Record<string, unknown> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion)
    const testContext: Record<string, unknown> = {}

    for (const step of flowSteps) {
        if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = inputUiInfo.currentTestSampleData
        }
    }

    return testContext
}

export const stepRunService = {
    async create({ projectId, flowVersionId, stepName }: CreateParams): Promise<unknown> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (step.type !== ActionType.PIECE) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `step is not a piece action stepName=${stepName}`,
                },
            })
        }

        const { pieceName, pieceVersion, actionName, input } = step.settings

        const testExecutionContext = generateTestExecutionContext(flowVersion)

        const operation: ExecuteActionOperation = {
            pieceName,
            pieceVersion,
            actionName,
            input,
            testExecutionContext,
            projectId,
        }

        const result = await engineHelper.executeAction(operation)

        step.settings.inputUiInfo.currentTestSampleData = result
        await flowVersionService.overwriteVersion(flowVersionId, flowVersion)

        return result
    },
}
