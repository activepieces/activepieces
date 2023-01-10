import { BaseModel } from "../common/base-model";
import { ProjectId } from "../project/project";

export enum AppSecretType {
  OAUTH2 = "OAUTH2",
  CLOUD_OAUTH2 = "CLOUD_OAUTH2",
  API_KEY = "API_KEY"
}

export type AppCredentialId = string;

export interface OAuth2Settings {
  clientId: string;
  clientSecret: string;
}

export interface AppCredential extends BaseModel<AppCredentialId> {
  name: string;
  projectId: ProjectId;
  type: AppSecretType;
  settings: OAuth2Settings | {}
}