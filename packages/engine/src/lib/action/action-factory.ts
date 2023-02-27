import { Action, ActionType } from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { CodeActionHandler } from './code-action-handler';
import { PieceActionHandler } from './piece-action-handler';
import { LoopOnItemActionHandler } from './loop-action-handler';
import { BranchActionHandler } from './branch-action-handler';

export function createAction(
  jsonData: any
): BaseActionHandler<Action> | undefined {
  if (jsonData === undefined || jsonData === null) {
    return undefined;
  }
  const currentAction: Action = jsonData as Action;
  const nextAction: BaseActionHandler<Action> | undefined = createAction(
    jsonData['nextAction']
  );
  switch (currentAction.type) {
    case ActionType.CODE:
      return new CodeActionHandler(currentAction, nextAction);
    case ActionType.PIECE:
      return new PieceActionHandler(currentAction, nextAction);
    case ActionType.BRANCH:
      return new BranchActionHandler(
        currentAction,
        createAction(jsonData['onSuccessAction']),
        createAction(jsonData['onFailureAction']),
        nextAction
      );
    case ActionType.LOOP_ON_ITEMS:
      return new LoopOnItemActionHandler(
        currentAction,
        createAction(jsonData['firstLoopAction']),
        nextAction
      );
  }
}
