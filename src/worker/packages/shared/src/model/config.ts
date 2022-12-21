export interface Config<T extends ConfigType, V> {
  key: string;
  type: T;
  value: V;
}

export interface ShortTextConfig extends Config<ConfigType.SHORT_TEXT, string> {
}

export interface LongTextConfig extends Config<ConfigType.LONG_TEXT, string> {
}

export interface CheckboxConfig extends Config<ConfigType.CHECKBOX, boolean> {
}

export interface DictionaryConfig extends Config<ConfigType.DICTIONARY, Record<string, unknown>> {
}

export interface NumberConfig extends Config<ConfigType.NUMBER, number> {
}


export enum ConfigType {
  CHECKBOX = "CHECKBOX",
  NUMBER = "NUMBER",
  DICTIONARY = "DICTIONARY",
  LONG_TEXT = "LONG_TEXT",
  SHORT_TEXT = "SHORT_TEXT",
  OAUTH2 = "OAUTH2"
}
