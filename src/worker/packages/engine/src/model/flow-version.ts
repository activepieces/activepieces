import {Variable} from './variable/variable';
import {TriggerMetadata} from "./trigger/trigger-metadata";
import {createTrigger} from "./trigger/trigger-factory";

export class FlowVersion {
  trigger?: TriggerMetadata;

  constructor(trigger?: TriggerMetadata) {
    this.trigger = trigger;
  }

  static deserialize(jsonData: any): FlowVersion {
    const trigger = !jsonData['trigger']
      ? undefined
      : createTrigger(jsonData['trigger']);

    return new FlowVersion(trigger);
  }

}
