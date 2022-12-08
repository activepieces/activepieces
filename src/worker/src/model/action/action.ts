import {ExecutionState} from '../execution/execution-state';
import {StepOutput} from '../output/step-output';
import {StoreScope} from '../util/store-scope';

export enum ActionType {
  CODE = 'CODE',
  COMPONENT = 'COMPONENT',
  STORAGE = 'STORAGE',
  REMOTE_FLOW = 'REMOTE_FLOW',
  RESPONSE = 'RESPONSE',
  LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
}

export abstract class Action {
  type: ActionType;
  name: string;
  nextAction?: Action;

  protected constructor(type: ActionType, name: string, nextAction?: Action) {
    this.validate(type, name);
    this.type = type;
    this.name = name;
    this.nextAction = nextAction;
  }

  validate(type: ActionType, name: string) {
    if (!type) {
      throw Error('Action "type" attribute is undefined.');
    }

    if (!name) {
      throw Error('Action "name" attribute is undefined.');
    }
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][],
    storeScope: StoreScope
  ): Promise<StepOutput>;
}
