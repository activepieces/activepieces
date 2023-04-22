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
import { isEmpty, isNil } from 'lodash'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'

type CreateReturn = {
    success: boolean
    output: unknown
}

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
        if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE || step.type === ActionType.CODE || step.type === TriggerType.WEBHOOK) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = inputUiInfo?.currentSelectedData
        }
    }

    return testContext
}

export const stepRunService = {
    async create({ projectId, collectionId, flowVersionId, stepName }: CreateParams): Promise<CreateReturn> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step) || step.type !== ActionType.PIECE) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `invalid stepName (${stepName})`,
                },
            })
        }

        const { pieceName, pieceVersion, actionName, input } = step.settings

        if (isNil(actionName)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'actionName is undefined',
                },
            })
        }

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
        const success = isEmpty(result.standardError)

        if (success) {
            step.settings.inputUiInfo.currentSelectedData = result.output
            await flowVersionService.overwriteVersion(flowVersionId, flowVersion)
        }

        return {
            success,
            output: result.output,
        }
    },
}
