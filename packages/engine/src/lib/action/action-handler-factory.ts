import { Action, ActionType, BranchAction, BranchResumeStepMetadata, ExecutionType, LoopOnItemsAction, LoopResumeStepMetadata, ResumeStepMetadata } from '@activepieces/shared'
import { BaseActionHandler } from './action-handler'
import { CodeActionHandler } from './code-action-handler'
import { PieceActionHandler } from './piece-action-handler'
import { LoopOnItemActionHandler } from './loop-action-handler'
import { BranchActionHandler } from './branch-action-handler'
import { isNil } from '@activepieces/shared'

type CreateActionHandlerParams = {
    action: Action | undefined
    resumeStepMetadata?: ResumeStepMetadata
}

export function createActionHandler(params: CreateActionHandlerParams): BaseActionHandler | undefined {
    const { action, resumeStepMetadata } = params

    if (isNil(action)) {
        return undefined
    }

    const currentAction = action
    const nextAction = action.nextAction

    switch (currentAction.type) {
        case ActionType.CODE:
            return new CodeActionHandler({
                currentAction,
                nextAction,
            })

        case ActionType.PIECE: {
            const executionType = resumeStepMetadata
                ? ExecutionType.RESUME
                : ExecutionType.BEGIN

            return new PieceActionHandler({
                executionType,
                currentAction, nextAction,
            })
        }

        case ActionType.BRANCH:{
            const { onSuccessAction, onFailureAction } = action as BranchAction

            return new BranchActionHandler({
                currentAction,
                onSuccessAction,
                onFailureAction,
                nextAction,
                resumeStepMetadata: resumeStepMetadata as BranchResumeStepMetadata,
            })
        }

        case ActionType.LOOP_ON_ITEMS: {
            const { firstLoopAction } = action as LoopOnItemsAction
            return new LoopOnItemActionHandler({
                currentAction,
                firstLoopAction,
                nextAction,
                resumeStepMetadata: resumeStepMetadata as LoopResumeStepMetadata,
            })
        }
    }

    return undefined
}
