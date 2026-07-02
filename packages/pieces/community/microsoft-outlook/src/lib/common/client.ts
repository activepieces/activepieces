import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphBaseUrl, getMicrosoftCloudFromAuth } from './microsoft-cloud';

function createClient(auth: OAuth2PropertyValue): Client {
  const cloud = getMicrosoftCloudFromAuth(auth);
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => Promise.resolve(auth.access_token),
    },
    baseUrl: getGraphBaseUrl(cloud),
  });
}

/**
 * Delegated connections act as the signed-in user (`/me`). App-only
 * (client-credentials) tokens have no user context, so they must address a
 * specific mailbox via `/users/{id}`. Presence of the `mailbox` prop is what
 * distinguishes the two, since the piece cannot read the connection's grant type.
 */
function mailboxPrefix(auth: OAuth2PropertyValue): string {
  const mailbox = (auth.props?.['mailbox'] as string | undefined)?.trim();
  return mailbox ? `/users/${encodeURIComponent(mailbox)}` : '/me';
}

export const outlookCommon = { createClient, mailboxPrefix };
