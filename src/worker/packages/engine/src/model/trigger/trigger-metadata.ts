import {createAction} from "../action/action-factory";
import {ActionMetadata} from "../action/action-metadata";

export enum TriggerStepType {
  COMPONENT = 'COMPONENT',
  OTHER = 'OTHER'
}


export class TriggerMetadata {
  nextAction?: ActionMetadata;
  type: TriggerStepType;

  constructor(type: TriggerStepType, nextAction?: ActionMetadata) {
    this.nextAction = nextAction;
    this.type = type;
  }

  static deserialize(jsonData: any): TriggerMetadata {
    const nextAction = !jsonData['nextAction']
      ? undefined
      : createAction(jsonData['nextAction']);

    return new TriggerMetadata(jsonData['type'], nextAction);
  }
}
