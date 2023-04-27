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
import { logger } from '../../helper/logger'
import { get, isEmpty, isNil } from 'lodash'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'

type CreateReturn = {
    success: boolean
    output: unknown
}

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}

const resolveLoopFirstItem = (flowVersion: FlowVersion, loopItemExpression: string): string => {
    logger.debug(`[StepRunService#resolveLoopFirstItem] loopItemExpression=${loopItemExpression}`)

    const loopItemRegex = /^\$\{(?<loopStepPathString>.+)\}$/
    const loopStepPathString = loopItemExpression.match(loopItemRegex)?.groups?.loopStepPathString

    logger.debug(`[StepRunService#resolveLoopFirstItem] loopStepPathString=${loopStepPathString}`)

    if (isNil(loopStepPathString)) {
        return ''
    }

    const loopStepPath = loopStepPathString.split('.')
    const stepName = loopStepPath.shift()

    logger.debug(`[StepRunService#resolveLoopFirstItem] stepName=${stepName}`)

    if (isNil(stepName)) {
        return ''
    }

    const step = flowHelper.getStep(flowVersion, stepName)

    if (isNil(step)) {
        return ''
    }
    //In case the loopStepPath is empty it means direct access to the step and not to a nested property
    const firstItemPath = 'settings.inputUiInfo.currentSelectedData' + loopStepPath.map((path) => `.${path}`).join('') + '[0]'

    logger.debug(`[StepRunService#resolveLoopFirstItem] firstItemPath=${firstItemPath}`)

    const result = get(step, firstItemPath, '')

    logger.debug(`[StepRunService#resolveLoopFirstItem] result=${result}`)

    return result
}

const generateTestExecutionContext = (flowVersion: FlowVersion): Record<string, unknown> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion)
    const testContext: Record<string, unknown> = {}

    for (const step of flowSteps) {
        const stepsWithSampleData = [ActionType.CODE, ActionType.PIECE, TriggerType.PIECE, TriggerType.WEBHOOK]
        if (stepsWithSampleData.includes(step.type)) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = inputUiInfo?.currentSelectedData
        }

        if (step.type === ActionType.LOOP_ON_ITEMS) {
            testContext[step.name] = {
                index: 1,
                item: resolveLoopFirstItem(flowVersion, step.settings.items),
            }
        }
    }

    return testContext
}

export const stepRunService = {
    async create({ projectId, flowVersionId, stepName }: CreateParams): Promise<CreateReturn> {
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
