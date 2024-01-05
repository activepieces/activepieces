import {
    ActionType,
    ActivepiecesError,
    StepRunResponse,
    ErrorCode,
    flowHelper,
    FlowVersionId,
    ProjectId,
    UserId,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import { isNil } from '@activepieces/shared'

export const stepRunService = {
    async create({ projectId, flowVersionId, stepName }: CreateParams): Promise<StepRunResponse> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step) || !Object.values(ActionType).includes(step.type as ActionType)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName,
                },
            })
        }
        const { result, standardError, standardOutput } = await engineHelper.executeAction({
            stepName,
            flowVersion,
            projectId,
        })
        return {
            success: result.success,
            output: result.output,
            standardError,
            standardOutput,
        }

    },
}

type CreateParams = {
    userId: UserId
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
}
