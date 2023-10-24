import { Static, Type } from "@sinclair/typebox";
import { BaseModel, BaseModelSchema } from "../common/base-model";
import { OAuth2AuthorizationMethod } from "./oauth2-authorization-method";
import { ApId } from "../common/id-generator";

export type AppConnectionId = string;

export enum AppConnectionStatus {
  ACTIVE = "ACTIVE",
  ERROR = "ERROR"
}

export enum AppConnectionType {
  OAUTH2 = "OAUTH2",
  CLOUD_OAUTH2 = "CLOUD_OAUTH2",
  SECRET_TEXT = "SECRET_TEXT",
  BASIC_AUTH = "BASIC_AUTH",
  CUSTOM_AUTH ="CUSTOM_AUTH"
}

export interface SecretTextConnectionValue {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: string;
}
export interface BasicAuthConnectionValue {
  username: string;
  password: string;
  type: AppConnectionType.BASIC_AUTH
}

export interface BaseOAuth2ConnectionValue {
  expires_in?: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  authorization_method?: OAuth2AuthorizationMethod,
  data: Record<string, any>
}

export interface CustomAuthConnectionValue
{
  type: AppConnectionType.CUSTOM_AUTH;
  props: Record<string, unknown>;
}

export interface CloudOAuth2ConnectionValue extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.CLOUD_OAUTH2;
  client_id: string;
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  data: Record<string, any>
  props?: Record<string, any>;
  token_url: string;
}

export interface OAuth2ConnectionValueWithApp extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.OAUTH2;
  client_id: string;
  client_secret: string;
  token_url: string;
  redirect_url: string;
  props?: Record<string, any>;
}

export type AppConnectionValue<T extends AppConnectionType = AppConnectionType> =
  T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue :
  T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue :
  T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue :
  T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp :
  T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue :
  never;

export type AppConnection<Type extends AppConnectionType = AppConnectionType> = BaseModel<AppConnectionId> & {
  name: string;
  type: Type;
  appName: string;
  projectId: string;
  status: AppConnectionStatus;
  value: AppConnectionValue<Type>
}

export type OAuth2AppConnection = AppConnection<AppConnectionType.OAUTH2>;
export type SecretKeyAppConnection = AppConnection<AppConnectionType.SECRET_TEXT>;
export type CloudAuth2Connection = AppConnection<AppConnectionType.CLOUD_OAUTH2>;
export type BasicAuthConnection = AppConnection<AppConnectionType.BASIC_AUTH>;
export type CustomAuthConnection = AppConnection<AppConnectionType.CUSTOM_AUTH>;

export const AppConnectionWithoutSensitiveData = Type.Object({
  ...BaseModelSchema,
  name: Type.String(),
  type: Type.Enum(AppConnectionType),
  appName: Type.String(),
  projectId: ApId,
  status: Type.Enum(AppConnectionStatus),
})

export type AppConnectionWithoutSensitiveData = Static<typeof AppConnectionWithoutSensitiveData> & { __brand: 'AppConnectionWithoutSensitiveData' }
