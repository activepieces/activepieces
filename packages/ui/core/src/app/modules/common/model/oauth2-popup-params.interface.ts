export type OAuth2PopupParams = {
  client_id: string;
  redirect_url?: string;
  scope: string;
  auth_url: string;
  pkce?: boolean;
  extraParams: Record<string, unknown>;
};

export type OAuth2PopupResponse = {
  code: string;
  code_challenge?: string;
};
