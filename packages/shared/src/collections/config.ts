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
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string[];
  data: Record<string, any>
}

export interface CloudOAuth2ConfigSettings {
  pieceName: string;
}

export interface CloudOAuth2Config
  extends BasicConfig<ConfigType.CLOUD_OAUTH2, OAuth2Response> {
  settings: CloudOAuth2ConfigSettings;
}

export interface OAuth2ConfigSettings {
  pieceName: string | null;
  tokenUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  redirectUrl: string;
}

export interface OAuth2Config
  extends BasicConfig<ConfigType.OAUTH2, OAuth2Response> {
  settings: OAuth2ConfigSettings;
}

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
