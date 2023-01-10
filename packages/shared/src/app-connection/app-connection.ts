import { AppCredentialId } from "../app-credential/app-credential";
import { BaseModel } from "../common/base-model";

export type AppConnectionId = string;

// Note: Currently there is no apps for API Key, We can add them when there is demand.
export interface AppConnection extends BaseModel<AppConnectionId> {
  name: string;
  projectId: string;
  appCredentialId: AppCredentialId;
  connection: OAuth2Response | ApiKey;
}

export interface ApiKey {
  api_key: string;
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
