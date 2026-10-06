import { AppConnectionType } from '@activepieces/pieces-framework';
import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { DEFAULT_LOCATION, DOCUMENT_AI_SCOPE } from '../auth';
import type { googleDocumentAiAuth } from '../auth';
import { mintServiceAccountToken, parseServiceAccountKey } from './service-account';

export function normalizeLocation(value: string | undefined): string {
  const location = String(value ?? '')
    .trim()
    .toLowerCase();
  if (location === '') return DEFAULT_LOCATION;
  if (!/^[a-z][a-z0-9-]*$/.test(location)) {
    throw new Error(`Invalid location "${value}": use a Document AI location id such as us or eu.`);
  }
  return location;
}

export function normalizeProjectId(value: string | undefined): string {
  const projectId = String(value ?? '').trim();
  if (projectId === '') {
    throw new Error('The connection has no Google Cloud project ID.');
  }
  if (!/^[a-z0-9][a-z0-9:.-]*$/i.test(projectId)) {
    throw new Error(`Invalid project ID "${value}": use the project ID shown in Google Cloud Console (e.g. my-company-prod).`);
  }
  return projectId;
}

export async function resolveServiceAccount(props: ServiceAccountProps): Promise<ResolvedAuth> {
  const key = parseServiceAccountKey(props.keyFile);
  const projectId = normalizeProjectId(props.projectId?.trim() ? props.projectId : key.projectId);
  return {
    accessToken: await mintServiceAccountToken({ key, scopes: [DOCUMENT_AI_SCOPE] }),
    projectId,
    location: normalizeLocation(props.location),
  };
}

export async function resolveAuth(auth: GoogleDocumentAiAuthValue | undefined): Promise<ResolvedAuth> {
  if (!auth) {
    throw new Error('A Google Document AI connection is required.');
  }
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return resolveServiceAccount(auth.props);
  }
  if (!auth.access_token) {
    throw new Error('The Google Document AI connection has no access token; reconnect it.');
  }
  return {
    accessToken: auth.access_token,
    projectId: normalizeProjectId(stringProp({ props: auth.props, key: 'projectId' })),
    location: normalizeLocation(stringProp({ props: auth.props, key: 'location' })),
  };
}

export function connectionLocation(auth: GoogleDocumentAiAuthValue | undefined): string | undefined {
  if (!auth) return undefined;
  if (auth.type === AppConnectionType.CUSTOM_AUTH) return auth.props.location;
  return stringProp({ props: auth.props, key: 'location' });
}

function stringProp({ props, key }: { props: Record<string, unknown> | undefined; key: string }): string | undefined {
  const value = props?.[key];
  return typeof value === 'string' ? value : undefined;
}

export type GoogleDocumentAiAuthValue = AppConnectionValueForAuthProperty<typeof googleDocumentAiAuth>;

export type ResolvedAuth = {
  accessToken: string;
  projectId: string;
  location: string;
};

export type ServiceAccountProps = { keyFile: string; location: string; projectId?: string | undefined };
