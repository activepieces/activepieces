import { BaseModel } from "../common/base-model";

export type AppConnectionId = string;

interface BaseAppConnection<T extends AppConnectionType, S> extends BaseModel<AppConnectionId> {
  name: string;
  appName: string;
  projectId: string;
  type: T,
  connection: S;
}

export enum AppConnectionType {
  OAUTH2 = "OAUTH2",
  CLOUD_OAUTH2 = "CLOUD_OAUTH2",
  API_KEY = "API_KEY"
}

export interface ApiKey {
  api_key: string;
}

export interface OAuth2Settings {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  redirectUrl: string;
}

export interface OAuth2Response {
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string[];
  data: Record<string, any>
}

export type OAuth2AppConnection = (BaseAppConnection<AppConnectionType.OAUTH2, OAuth2Response> & { settings: OAuth2Settings });
export type ApiKeyAppConnection = BaseAppConnection<AppConnectionType.API_KEY, ApiKey>
export type CloudAuth2Connection = BaseAppConnection<AppConnectionType.CLOUD_OAUTH2, OAuth2Response>

export type AppConnection = ApiKeyAppConnection | OAuth2AppConnection | CloudAuth2Connection;