import { OAuth2AppDetails } from '@activepieces/shared';
export type OAuth2PopupParams = OAuth2AppDetails & {
  scope: string;
  auth_url: string;
  extraParams: Record<string, unknown>;
};
export interface CloudOAuth2PopupParams {
  clientId: string;
  auth_url: string;
  extraParams: Record<string, unknown>;
  scope: string;
  pieceName: string;
  token_url?: string;
}
