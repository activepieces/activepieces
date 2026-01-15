import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod, createCustomApiCallAction } from '@activepieces/pieces-common';
import { readSecret } from './lib/actions/read-secret';
import { writeSecret } from './lib/actions/write-secret';
import { deleteSecret } from './lib/actions/delete-secret';
import { listSecrets } from './lib/actions/list-secrets';

const markdownDescription = `
Connect to HashiCorp Vault to securely manage secrets.

**Authentication Methods:**
- **Token**: Use a Vault token directly
- **AppRole**: Use Role ID and Secret ID for machine authentication
`;

export const hashiCorpVaultAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    url: Property.ShortText({
      displayName: 'Vault URL',
      description: 'The URL of your HashiCorp Vault instance (e.g., https://vault.example.com:8200)',
      required: true,
    }),
    authMethod: Property.StaticDropdown({
      displayName: 'Authentication Method',
      description: 'Choose how to authenticate with Vault',
      required: true,
      defaultValue: 'token',
      options: {
        options: [
          { label: 'Token', value: 'token' },
          { label: 'AppRole', value: 'appRole' },
        ],
      },
    }),
    token: PieceAuth.SecretText({
      displayName: 'Vault Token',
      description: 'Your Vault authentication token',
      required: false,
    }),
    roleId: Property.ShortText({
      displayName: 'Role ID',
      description: 'The Role ID for AppRole authentication',
      required: false,
    }),
    secretId: PieceAuth.SecretText({
      displayName: 'Secret ID',
      description: 'The Secret ID for AppRole authentication',
      required: false,
    }),
    appRolePath: Property.ShortText({
      displayName: 'AppRole Mount Path',
      description: 'The mount path of the AppRole auth method',
      required: false,
      defaultValue: 'approle',
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'Vault namespace (Enterprise feature, leave empty if not using)',
      required: false,
    }),
    apiVersion: Property.StaticDropdown({
      displayName: 'KV Secrets Engine Version',
      description: 'The version of the KV secrets engine',
      required: true,
      defaultValue: 'v2',
      options: {
        options: [
          { label: 'Version 1 (KV v1)', value: 'v1' },
          { label: 'Version 2 (KV v2)', value: 'v2' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    // Validate required fields based on auth method
    if (auth.authMethod === 'token') {
      if (!auth.token) {
        return {
          valid: false,
          error: 'Vault Token is required when using Token authentication',
        };
      }
    } else if (auth.authMethod === 'appRole') {
      if (!auth.roleId || !auth.secretId) {
        return {
          valid: false,
          error: 'Role ID and Secret ID are required when using AppRole authentication',
        };
      }
    }

    try {
      const baseUrl = auth.url.replace(/\/$/, '');
      let token: string;

      if (auth.authMethod === 'token') {
        if (!auth.token) {
          throw new Error('Vault Token is required when using Token authentication');
        }
        token = auth.token;
      } else {
        // Test AppRole login
        const appRolePath = auth.appRolePath || 'approle';
        const response = await httpClient.sendRequest<{
          auth?: { client_token?: string };
        }>({
          method: HttpMethod.POST,
          url: `${baseUrl}/v1/auth/${appRolePath}/login`,
          headers: {
            'Content-Type': 'application/json',
            ...(auth.namespace && { 'X-Vault-Namespace': auth.namespace }),
          },
          body: {
            role_id: auth.roleId,
            secret_id: auth.secretId,
          },
        });

        if (!response.body.auth?.client_token) {
          return {
            valid: false,
            error: 'AppRole authentication failed: No token received',
          };
        }
        token = response.body.auth.client_token;
      }

      // Verify token by checking token info
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/auth/token/lookup-self`,
        headers: {
          'X-Vault-Token': token,
          ...(auth.namespace && { 'X-Vault-Namespace': auth.namespace }),
        },
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Connection failed: ${errorMessage}`,
      };
    }
  },
  required: true,
});

export const hashiCorpVault = createPiece({
  displayName: 'HashiCorp Vault',
  description: 'Securely manage secrets and sensitive data with HashiCorp Vault',
  auth: hashiCorpVaultAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hashi-corp-vault.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    readSecret,
    writeSecret,
    deleteSecret,
    listSecrets,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth?.props.url || '').replace(/\/$/, ''),
      auth: hashiCorpVaultAuth,
      authMapping: async (auth) => {
        let token: string;
        if (auth.props.authMethod === 'token') {
          token = auth.props.token || '';
        } else {
          const appRolePath = auth.props.appRolePath || 'approle';
          const baseUrl = (auth.props.url || '').replace(/\/$/, '');
          const response = await httpClient.sendRequest<{
            auth?: { client_token?: string };
          }>({
            method: HttpMethod.POST,
            url: `${baseUrl}/v1/auth/${appRolePath}/login`,
            headers: {
              'Content-Type': 'application/json',
              ...(auth.props.namespace && { 'X-Vault-Namespace': auth.props.namespace }),
            },
            body: {
              role_id: auth.props.roleId || '',
              secret_id: auth.props.secretId || '',
            },
          });
          token = response.body.auth?.client_token || '';
        }
        return {
          'X-Vault-Token': token,
          ...(auth.props.namespace && { 'X-Vault-Namespace': auth.props.namespace }),
        };
      },
    }),
  ],
  triggers: [],
});