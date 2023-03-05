
import { BaseModel } from "@shared/common/base-model";
import { ProjectId } from "@activepieces/shared";

export type AppCredentialId = string;

export interface AppCredential extends BaseModel<AppCredentialId> {
  appName: string;
  projectId: ProjectId;
  settings: AppOAuth2Settings;
}

export interface AppOAuth2Settings {
  type: AppCredentialType.OAUTH2;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scope: string;
}

export enum AppCredentialType {
  OAUTH2 = "OAUTH2",
  API_KEY = "API_KEY"
}


