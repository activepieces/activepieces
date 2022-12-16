import {Variable} from './variable/variable';
import {TriggerMetadata} from "./trigger/trigger-metadata";

export class FlowVersion {
  trigger?: TriggerMetadata;

  constructor(trigger?: TriggerMetadata) {
    this.trigger = trigger;
  }

  static deserialize(jsonData: any): FlowVersion {
    const trigger = !jsonData['trigger']
      ? undefined
      : TriggerMetadata.deserialize(jsonData['trigger']);

    return new FlowVersion(trigger);
  }

}
