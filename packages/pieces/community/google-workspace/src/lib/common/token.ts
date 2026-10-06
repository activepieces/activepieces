import { AppConnectionType } from '@activepieces/pieces-framework';
import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { googleWorkspaceScopes } from '../auth';
import type { googleWorkspaceAuth } from '../auth';
import type { ResolvedAuth } from './client';
import { mintServiceAccountToken } from './service-account';

export async function resolveAuth(auth: GoogleWorkspaceAuthValue | undefined): Promise<ResolvedAuth> {
  if (!auth) {
    throw new Error('A Google Workspace connection is required.');
  }
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return { access_token: await mintServiceAccountToken({ creds: auth.props, scopes: googleWorkspaceScopes }) };
  }
  if (!auth.access_token) {
    throw new Error('The Google Workspace connection has no access token; reconnect it.');
  }
  return { access_token: auth.access_token };
}

export type GoogleWorkspaceAuthValue = AppConnectionValueForAuthProperty<typeof googleWorkspaceAuth>;
