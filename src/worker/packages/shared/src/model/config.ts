export abstract class Config<T extends ConfigType, V> {
  key: string;
  type: T;
  value: V;
}

export class ShortTextConfig extends Config<ConfigType.SHORT_TEXT, string> {
}

export class LongTextConfig extends Config<ConfigType.LONG_TEXT, string> {
}

export class CheckboxConfig extends Config<ConfigType.CHECKBOX, boolean> {
}

export class DictionaryConfig extends Config<ConfigType.DICTIONARY, Record<string, unknown>> {
}

export class NumberConfig extends Config<ConfigType.NUMBER, number> {
}


export enum ConfigType {
  CHECKBOX = "CHECKBOX",
  NUMBER = "NUMBER",
  DICTIONARY = "DICTIONARY",
  LONG_TEXT = "LONG_TEXT",
  SHORT_TEXT = "SHORT_TEXT",
  OAUTH2 = "OAUTH2"
}
