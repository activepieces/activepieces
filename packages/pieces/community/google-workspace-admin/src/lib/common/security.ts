import { HttpMethod } from '@activepieces/pieces-common';
import { GoogleWorkspaceAdminAuthValue } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from './client';

async function listVerificationCodes({ auth, user }: { auth: GoogleWorkspaceAdminAuthValue; user: string }) {
  const response = await googleAdminClient.request<{ items?: { userId: string; verificationCode: string }[] }>({
    auth,
    method: HttpMethod.GET,
    url: `${DIRECTORY_URL}/users/${encodeURIComponent(user)}/verificationCodes`,
  });
  return (response.items ?? []).map((c) => ({ user_id: c.userId, verification_code: c.verificationCode }));
}

function flattenAppPassword(asp: AppPassword) {
  return {
    code_id: asp.codeId,
    name: asp.name,
    user_id: asp.userKey,
    creation_time: toIsoDate(asp.creationTime),
    last_time_used: toIsoDate(asp.lastTimeUsed),
  };
}

function flattenToken(token: OAuthToken) {
  return {
    client_id: token.clientId,
    display_text: token.displayText ?? null,
    user_id: token.userKey,
    anonymous: token.anonymous ?? false,
    native_app: token.nativeApp ?? false,
    scopes: (token.scopes ?? []).join(', '),
  };
}

function toIsoDate(epochMs: string | undefined): string | null {
  const value = Number(epochMs);
  return epochMs && value > 0 ? new Date(value).toISOString() : null;
}

export const securityHelpers = { listVerificationCodes, flattenAppPassword, flattenToken };

export type AppPassword = {
  codeId: number;
  name: string;
  userKey: string;
  creationTime?: string;
  lastTimeUsed?: string;
};

export type OAuthToken = {
  clientId: string;
  displayText?: string;
  userKey: string;
  anonymous?: boolean;
  nativeApp?: boolean;
  scopes?: string[];
};
