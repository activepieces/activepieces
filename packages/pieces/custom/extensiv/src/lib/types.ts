export interface ExtensivCredentials {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  userLogin: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string | null;
  scope: string | null;
}
