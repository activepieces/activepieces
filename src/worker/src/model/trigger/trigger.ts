import {Action} from '../action/action';
import {createAction} from '../action/action-factory';

export enum TriggerType {
  COMPONENT = 'COMPONENT',
  SCHEDULE = 'SCHEDULE',
  WEBHOOK = 'WEBHOOK',
  COLLECTION_ENABLED = 'COLLECTION_ENABLED',
  COLLECTION_DISABLED = 'COLLECTION_DISABLED',
}

export class Trigger {
  nextAction?: Action;

  constructor(nextAction?: Action) {
    this.nextAction = nextAction;
  }

  static deserialize(jsonData: any): Trigger {
    const nextAction = !jsonData['nextAction']
      ? undefined
      : createAction(jsonData['nextAction']);

    return new Trigger(nextAction);
  }
}
