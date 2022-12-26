import {CodeAction, CodeActionSettings} from './types/code-action';
import {StorageAction, StorageActionSettings} from './types/storage-action';
import {ResponseAction, ResponseActionSettings} from './types/response-action';
import {LoopOnItemAction, LoopOnItemActionSettings} from './types/loop-action';
import { PieceAction, PieceActionSettings } from './types/piece-action';
import {ActionMetadata, ActionType} from "./action-metadata";

export function createAction(jsonData: any): ActionMetadata {
  try {
    switch (jsonData['type']) {
      case 'COMPONENT':
        return new PieceAction(
          ActionType.COMPONENT,
          jsonData['name'],
          PieceActionSettings.deserialize(jsonData['settings']),
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      case 'CODE':
        return new CodeAction(
          ActionType.CODE,
          jsonData['name'],
          CodeActionSettings.deserialize(jsonData['settings']),
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      case 'STORAGE':
        return new StorageAction(
          ActionType.STORAGE,
          jsonData['name'],
          StorageActionSettings.deserialize(jsonData['settings']),
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      case 'RESPONSE':
        return new ResponseAction(
          ActionType.RESPONSE,
          jsonData['name'],
          ResponseActionSettings.deserialize(jsonData['settings']),
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      case 'LOOP_ON_ITEMS':
        return new LoopOnItemAction(
          ActionType.LOOP_ON_ITEMS,
          jsonData['name'],
          LoopOnItemActionSettings.deserialize(jsonData['settings']),
          !jsonData['firstLoopAction']
            ? undefined
            : createAction(jsonData['firstLoopAction']),
          !jsonData['nextAction']
            ? undefined
            : createAction(jsonData['nextAction'])
        );
      default:
        throw new Error(`Action type (${jsonData['type']}) is not supported`);
    }
  } catch (e) {
    throw new Error(`Action creation failed: ${(e as Error).message}`);
  }
}
