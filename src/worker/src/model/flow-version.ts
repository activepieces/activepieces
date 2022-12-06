import {Variable} from './variable/variable';
import {Trigger} from './action/trigger';

export class FlowVersion {
  configs: Variable[];
  trigger?: Trigger;

  constructor(configs: Variable[], trigger?: Trigger) {
    this.configs = configs;
    this.trigger = trigger;
  }

  static deserialize(jsonData: any): FlowVersion {
    const configsArray = jsonData['configs'] as Array<any>;
    const configs = configsArray.map(variableJson =>
      Variable.deserialize(variableJson)
    );

    const trigger =
      !jsonData['trigger']
        ? undefined
        : Trigger.deserialize(jsonData['trigger']);

    return new FlowVersion(configs, trigger);
  }

  public getConfigsMap() {
    return new Map(
      this.configs.map(config => {
        return [config.key, config.value];
      })
    );
  }
}
