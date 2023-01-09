export type Config =
  | ShortTextConfig
  | LongTextConfig
  | CheckboxConfig
  | DictionaryConfig
  | NumberConfig;
  
export interface ShortTextConfig
  extends BasicConfig<ConfigType.SHORT_TEXT, string> {}

export interface LongTextConfig
  extends BasicConfig<ConfigType.LONG_TEXT, string> {}

export interface CheckboxConfig
  extends BasicConfig<ConfigType.CHECKBOX, boolean> {}

export interface DictionaryConfig
  extends BasicConfig<ConfigType.DICTIONARY, Record<string, unknown>> {}

export interface NumberConfig extends BasicConfig<ConfigType.NUMBER, number> {}

export enum ConfigType {
  CHECKBOX = 'CHECKBOX',
  NUMBER = 'NUMBER',
  DICTIONARY = 'DICTIONARY',
  LONG_TEXT = 'LONG_TEXT',
  SHORT_TEXT = 'SHORT_TEXT',
  // TODO REMOVE AFTER DEPRECATION
  CLOUD_OAUTH2 = 'CLOUD_AUTH2',
  OAUTH2 = 'OAUTH2',
}

interface BasicConfig<T extends ConfigType, V> {
  key: string;
  type: T;
  value: V;
}
