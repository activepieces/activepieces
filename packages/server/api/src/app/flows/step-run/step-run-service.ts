import {
    ActionType,
    ActivepiecesError,
    ErrorCode,
    flowHelper,
    FlowVersionId,
    isNil,
    LoopStepOutput,
    ProjectId,
    StepRunResponse,
} from '@activepieces/shared'
import { engineRunner } from 'server-worker'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { flowVersionService } from '../flow-version/flow-version.service'

const removeLoopIterations = (output: LoopStepOutput) => {
    const cleanedOutput = JSON.parse(JSON.stringify(output))
    delete cleanedOutput.iterations
    return cleanedOutput
}
export const stepRunService = {
    async create({
        projectId,
        flowVersionId,
        stepName,
    }: CreateParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (
            isNil(step) ||
      !Object.values(ActionType).includes(step.type as ActionType)
        ) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName,
                },
            })
        }
        const engineToken = await accessTokenManager.generateEngineToken({
            projectId,
        })

        const { result, standardError, standardOutput } =
      await engineRunner.executeAction(engineToken, {
          stepName,
          flowVersion,
          projectId,
      })

        return {
            success: result.success,
            output:
        step.type === ActionType.LOOP_ON_ITEMS
            ? removeLoopIterations(result.output as LoopStepOutput)
            : result.output,
            standardError,
            standardOutput,
        }
    },
}

type CreateParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}
