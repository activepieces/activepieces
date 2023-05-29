import {
    ActionType,
    ActivepiecesError,
    CodeAction,
    CodeRunStatus,
    ErrorCode,
    ExecuteActionOperation,
    flowHelper,
    FlowVersion,
    FlowVersionId,
    PieceAction,
    ProjectId,
    TriggerType,
} from '@activepieces/shared'
import { logger } from '../../helper/logger'
import { get, isNil } from 'lodash'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import { codeRunner } from '../../workers/code-worker/code-runner'
import { fileService } from '../../file/file.service'

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

        if (isNil(step) || (step.type !== ActionType.PIECE && step.type !== ActionType.CODE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `invalid stepName (${stepName})`,
                },
            })
        }
        const testExecutionContext = generateTestExecutionContext(flowVersion)

        switch(step.type) {
            case ActionType.PIECE: {
                return await executePiece({ step, testExecutionContext, projectId, flowVersionId, flowVersion })
            }
            case ActionType.CODE: {
                return await executeCode({ step, testExecutionContext, projectId })
            }
        }
    },
}

async function executePiece({ step, testExecutionContext, projectId, flowVersionId, flowVersion }: {
    step: PieceAction, testExecutionContext: Record<string, unknown>, projectId: ProjectId, flowVersionId: FlowVersionId, flowVersion: FlowVersion
}): Promise<CreateReturn> {
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
        input,
        testExecutionContext,
        projectId,
    }

    const {result} = await engineHelper.executeAction(operation)
    if (result.success) {
        step.settings.inputUiInfo.currentSelectedData = result.output
        await flowVersionService.overwriteVersion(flowVersionId, flowVersion)
    }
    return {
        success: result.success,
        output: result.output,
    }
}

async function executeCode({ step, testExecutionContext, projectId }: { step: CodeAction, testExecutionContext: Record<string, unknown>, projectId: ProjectId }): Promise<CreateReturn> {
    const file = await fileService.getOneOrThrow({
        projectId,
        fileId: step.settings.artifactSourceId!,
    })
    const result = await codeRunner.run(file.data, testExecutionContext)
    return {
        success: result.verdict === CodeRunStatus.OK,
        output: result,
    }
}
