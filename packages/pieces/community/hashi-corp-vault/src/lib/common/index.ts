import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { hashiCorpVaultAuth } from '../../index';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

export interface VaultAuthResult {
  token: string;
  baseUrl: string;
  namespace?: string;
  apiVersion: string;
}

export async function getVaultToken(
  auth: AppConnectionValueForAuthProperty<typeof hashiCorpVaultAuth>
): Promise<VaultAuthResult> {
  const baseUrl = auth.props.url.replace(/\/$/, '');
  const namespace = auth.props.namespace || undefined;
  const apiVersion = auth.props.apiVersion || 'v2';

  let token: string;

  if (auth.props.authMethod === 'token') {
    if (!auth.props.token) {
      throw new Error('Vault Token is required for token authentication');
    }
    token = auth.props.token;
  } else {
    // AppRole authentication
    if (!auth.props.roleId || !auth.props.secretId) {
      throw new Error('Role ID and Secret ID are required for AppRole authentication');
    }
    const appRolePath = auth.props.appRolePath || 'approle';
    const loginUrl = `${baseUrl}/v1/auth/${appRolePath}/login`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: loginUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(namespace && { 'X-Vault-Namespace': namespace }),
      },
      body: {
        role_id: auth.props.roleId,
        secret_id: auth.props.secretId,
      },
    };

    try {
      const response = await httpClient.sendRequest<{
        auth?: { client_token?: string };
      }>(request);

      if (!response.body.auth?.client_token) {
        throw new Error('Failed to obtain token from AppRole login');
      }

      token = response.body.auth.client_token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`AppRole authentication failed: ${errorMessage}`);
    }
  }

  return {
    token,
    baseUrl,
    namespace,
    apiVersion,
  };
}

export function buildVaultHeaders(
  token: string,
  namespace?: string,
  customHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'X-Vault-Token': token,
    'Content-Type': 'application/json',
    ...(namespace && { 'X-Vault-Namespace': namespace }),
    ...customHeaders,
  };
}

export function buildSecretUrl(
  baseUrl: string,
  secretEngine: string,
  secretPath: string,
  apiVersion: string,
  operation: 'read' | 'write' | 'delete' | 'list'
): string {
  const cleanPath = secretPath.replace(/^\/+|\/+$/g, '');

  if (apiVersion === 'v2') {
    switch (operation) {
      case 'read':
      case 'write':
        return `${baseUrl}/v1/${secretEngine}/data/${cleanPath}`;
      case 'delete':
      case 'list':
        return `${baseUrl}/v1/${secretEngine}/metadata/${cleanPath}`;
    }
  } else {
    return `${baseUrl}/v1/${secretEngine}/${cleanPath}`;
  }
}
