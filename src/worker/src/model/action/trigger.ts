import {Action} from './action';
import {createAction} from './action-factory';

export class Trigger {
  nextAction?: Action;

  constructor(nextAction?: Action) {
    this.nextAction = nextAction;
  }

  static deserialize(jsonData: any): Trigger {
    const nextAction =
      !jsonData['nextAction']
        ? undefined
        : createAction(jsonData['nextAction']);

    return new Trigger(nextAction);
  }
}
