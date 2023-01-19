import { Action, ActionType } from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { CodeActionHandler } from './code-action-handler';
import { PieceActionHandler } from './piece-action-handler';
import { LoopOnItemActionHandler } from './loop-action-handler';
import { StorageActionHandler } from './storage-action-handler';

export function createAction(
  jsonData: any
): BaseActionHandler<any> | undefined {
  if (jsonData === undefined || jsonData === null) {
    return undefined;
  }
  let currentAction: Action = jsonData as Action;
  let nextAction: BaseActionHandler<any> | undefined = createAction(
    jsonData['nextAction']
  );
  switch (currentAction.type) {
    case ActionType.STORAGE:
      return new StorageActionHandler(currentAction, nextAction);
    case ActionType.CODE:
      return new CodeActionHandler(currentAction, nextAction);
    case ActionType.PIECE:
      return new PieceActionHandler(currentAction, nextAction);
    case ActionType.LOOP_ON_ITEMS:
      return new LoopOnItemActionHandler(
        currentAction,
        createAction(jsonData['firstLoopAction']),
        nextAction
      );
  }
}
