export type Config =
  | ShortTextConfig
  | LongTextConfig
  | CheckboxConfig
  | DictionaryConfig
  | NumberConfig
  | CloudOAuth2Config
  | OAuth2Config;

export interface ShortTextConfig
  extends BasicConfig<ConfigType.SHORT_TEXT, string> {}

export interface LongTextConfig
  extends BasicConfig<ConfigType.LONG_TEXT, string> {}

export interface CheckboxConfig
  extends BasicConfig<ConfigType.CHECKBOX, boolean> {}

export interface DictionaryConfig
  extends BasicConfig<ConfigType.DICTIONARY, Record<string, unknown>> {}

export interface NumberConfig extends BasicConfig<ConfigType.NUMBER, number> {}

export interface OAuth2Response {
  expires_in: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  scope: string;
}

export interface CloudOAuth2ConfigSettings {
  pieceName: string;
  response: OAuth2Response;
}

export interface CloudOAuth2Config
  extends BasicConfig<ConfigType.CLOUD_OAUTH2, CloudOAuth2ConfigSettings> {}

export interface OAuth2ConfigSettings {
  pieceName: string | null;
  tokenUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  redirectUrl: string;
  response: OAuth2Response;
}

export interface OAuth2Config
  extends BasicConfig<ConfigType.OAUTH2, OAuth2ConfigSettings> {}

export enum ConfigType {
  CHECKBOX = 'CHECKBOX',
  NUMBER = 'NUMBER',
  DICTIONARY = 'DICTIONARY',
  LONG_TEXT = 'LONG_TEXT',
  SHORT_TEXT = 'SHORT_TEXT',
  CLOUD_OAUTH2 = 'CLOUD_AUTH2',
  OAUTH2 = 'OAUTH2',
}

interface BasicConfig<T extends ConfigType, V> {
  key: string;
  type: T;
  value: V;
}
