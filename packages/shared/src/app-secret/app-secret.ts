import { Static, Type } from "@sinclair/typebox";
import { BaseModel, BaseModelSchema } from "../common/base-model";
import { ProjectId } from "../project/project";

export enum AppSecretType {
  OAUTH2 = "OAUTH2",
  API_KEY = "API_KEY"
}

export enum AppName {
  SALESFORCE = "SALESFORCE",
  BLACKBAUD = "BLACKBAUD"
}


export const OAuth2Settings = Type.Object({
  clientId: Type.String({}),
  clientSecret: Type.String({}),
  scope: Type.String({}),
});

export const OAuth2AppSecret = Type.Object({
  ...BaseModelSchema,
  name: Type.Union([Type.Literal(AppName.SALESFORCE), Type.Literal(AppName.BLACKBAUD)]),
  projectId: Type.String({}),
  type: Type.Literal(AppSecretType.OAUTH2),
  settings: OAuth2Settings,
});

export type OAuth2AppSecret = Static<typeof OAuth2AppSecret>;

export type AppSecretId = string;

export const AppSecret = Type.Union([OAuth2AppSecret]);
export type AppSecret = Static<typeof OAuth2AppSecret> & { id: AppSecretId };

