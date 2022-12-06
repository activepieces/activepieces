import {Action, ActionType} from '../action';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';

export enum StorageOperation {
  GET = 'GET',
  PUT = 'PUT',
}

export enum StorageScope {
  INSTANCE = 'INSTANCE',
}

export class StorageActionSettings {
  operation: StorageOperation;
  key: string;
  value: string;
  scope: StorageScope;

  constructor(
    operation: StorageOperation,
    key: string,
    value: string,
    scope: StorageScope
  ) {
    this.operation = operation;
    this.key = key;
    this.value = value;
    this.scope = scope;
  }

  static deserialize(jsonData: any): StorageActionSettings {
    return new StorageActionSettings(
      jsonData['operation'] as StorageOperation,
      jsonData['key'],
      jsonData['value'],
      jsonData['scope'] as StorageScope
    );
  }
}

export class StorageAction extends Action {
  settings: StorageActionSettings;

  constructor(
    type: ActionType,
    name: string,
    settings: StorageActionSettings,
    nextAction?: Action
  ) {
    super(type, name, nextAction);
    this.settings = settings;
  }

  execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();
    stepOutput.status = StepOutputStatus.SUCCEEDED;
    return Promise.resolve(stepOutput);
  }
}
