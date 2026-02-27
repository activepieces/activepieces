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
import { hashiCorpVaultAuth } from './lib/auth';

const markdownDescription = `
Connect to HashiCorp Vault to securely manage secrets.

**Authentication Methods:**
- **Token**: Use a Vault token directly
- **AppRole**: Use Role ID and Secret ID for machine authentication
`;

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