import { engineHelper } from '../../helper/engine-helper'
import { flowVersionService } from '../flow-version/flow-version.service'
import {
    ActionType,
    ActivepiecesError,
    ErrorCode,
    flowHelper,
    FlowVersionId,
    isNil,
    ProjectId,
    stepRunEventEmitter,
    StepRunResponse,
} from '@activepieces/shared'

export const stepRunService = {
    async stepOutput(stepName: string, stepOutput: unknown): Promise<unknown> {
        // testing for approval step
        // handle the event after hitting the webhook -> { action: string }
        const outputPromise = new Promise(resolve => {
            // TODO: need to generalize it
            if (stepName === 'wait_for_approval') {
                stepRunEventEmitter.once((data: any) => {
                    resolve({
                        approved: data.action === 'approve',
                        denied: data.action !== 'approve',
                    })
                })
            }
            else {
                resolve(stepOutput)
            }
        })

        return outputPromise
    },
    async create({
        projectId,
        flowVersionId,
        stepName,
    }: CreateParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (
            isNil(step) || !Object.values(ActionType).includes(step.type as ActionType)
        ) {
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

        const output = await this.stepOutput(step.name, result.output)
        
        return {
            success: result.success,
            output,
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
