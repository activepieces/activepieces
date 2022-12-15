import {Variable} from './variable/variable';
import {Trigger} from './trigger/trigger';

export class FlowVersion {
  trigger?: Trigger;

  constructor(trigger?: Trigger) {
    this.trigger = trigger;
  }

  static deserialize(jsonData: any): FlowVersion {
    const trigger = !jsonData['trigger']
      ? undefined
      : Trigger.deserialize(jsonData['trigger']);

    return new FlowVersion(trigger);
  }

}
