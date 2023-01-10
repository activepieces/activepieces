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
  tokenUrl: string;
  redirectUrl: string;
}

export type AppCredential = BaseAppCredential<AppSecretType.OAUTH2, OAuth2Settings> | BaseAppCredential<AppSecretType.CLOUD_OAUTH2, {}> | BaseAppCredential<AppSecretType.API_KEY, {}>;

interface BaseAppCredential<T extends AppSecretType, S> extends BaseModel<AppCredentialId>{
  name: string;
  projectId: ProjectId;
  type: T;
  settings: S;
}