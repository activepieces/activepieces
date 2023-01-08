import { BaseModel } from "../common/base-model";
import { ProjectId } from "../project/project";

interface BaseSettings<T> {
  type: T;
}

export type AppAuthId = string;

export interface AppAuth extends BaseModel<AppAuthId> {
  name: AuthAppName;
  type: AppAuthType,
  projectId: ProjectId;
  settings: OAuth2Settings | ApikeySettings;
}

export interface ApikeySettings extends BaseSettings<AppAuthType.API_KEY> {}

export interface OAuth2Settings extends BaseSettings<AppAuthType.OAUTH2> {
  clientId: string;
  clientSecret: string;
  scope: string[];
}

export enum AppAuthType {
  OAUTH2 = "OAUTH2",
  API_KEY = "API_KEY"
}

export enum AuthAppName {
  SALESFORCE = "SALESFORCE",
  BLACKBAUD = "BLACKBAUD"
}

