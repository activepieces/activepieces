import { AppName, AppSecretId } from "../app-secret/app-secret";
import { OAuth2Response } from "../collections/config";
import { BaseModel } from "../common/base-model";

export type AppConnectionId = string;

// Note: Currently there is no apps for API Key, We can add them when there is demand.
export interface AppConnection extends BaseModel<AppConnectionId> {
  name: string;
  appSecretId: AppSecretId;
  connection: OAuth2Response;
}
