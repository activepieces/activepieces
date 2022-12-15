import {Variable} from './variable/variable';

export class CollectionVersion {
  configs: Variable[];

  constructor(configs: Variable[]) {
    this.configs = configs;
  }

  static deserialize(jsonData: any): CollectionVersion {
    const configsArray = jsonData['configs'] as Array<any>;
    const configs = configsArray.map(variableJson =>
      Variable.deserialize(variableJson)
    );

    return new CollectionVersion(configs);
  }

  public getConfigsMap() {
    return new Map(
      this.configs.map(config => {
        return [config.key, config.value];
      })
    );
  }
}
