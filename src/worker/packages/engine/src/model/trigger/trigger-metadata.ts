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
}
