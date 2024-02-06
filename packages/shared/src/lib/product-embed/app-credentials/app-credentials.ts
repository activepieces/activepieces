import { OAuth2GrantType } from "../../app-connection/dto/upsert-app-connection-request"
import { BaseModel } from "../../common"
import { ProjectId } from "../../project/project"

export type AppCredentialId = string;

export interface AppOAuth2Settings {
  type: AppCredentialType.OAUTH2;
  authUrl: string;
  tokenUrl: string;
  grantType: OAuth2GrantType,
  clientId: string;
  clientSecret?: string;
  scope: string;
}

export interface AppApiKeySettings {
  type: AppCredentialType.API_KEY;
}
export interface AppCredential extends BaseModel<AppCredentialId> {
  appName: string;
  projectId: ProjectId;
  settings: AppOAuth2Settings | AppApiKeySettings;
}

export enum AppCredentialType {
  OAUTH2 = "OAUTH2",
  API_KEY = "API_KEY"
}


