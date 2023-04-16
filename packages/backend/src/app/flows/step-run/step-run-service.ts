import {
    ActionType,
    ActivepiecesError,
    CollectionId,
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
    collectionId: CollectionId
    flowVersionId: FlowVersionId
    stepName: string
}

const generateTestExecutionContext = (flowVersion: FlowVersion): Record<string, unknown> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion)
    const testContext: Record<string, unknown> = {}

    for (const step of flowSteps) {
        if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE || step.type === ActionType.CODE) {
            const { name, settings: { inputUiInfo } } = step;
            testContext[name] = inputUiInfo?.currentSelectedData
        }
    }

    return testContext
}

export const stepRunService = {
    async create({ projectId, collectionId, flowVersionId, stepName }: CreateParams): Promise<unknown> {
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
            collectionId,
        }

        const result = await engineHelper.executeAction(operation)

        step.settings.inputUiInfo.currentSelectedData = result
        await flowVersionService.overwriteVersion(flowVersionId, flowVersion)

        return result
    },
}
