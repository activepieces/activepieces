import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hashiCorpVaultAuth } from '../../index';
import { getVaultToken, buildVaultHeaders, buildSecretUrl } from '../common';

export const listSecrets = createAction({
  auth: hashiCorpVaultAuth,
  name: 'list_secrets',
  displayName: 'List Secrets',
  description: 'List secrets at a path in HashiCorp Vault',
  props: {
    secretEngine: Property.ShortText({
      displayName: 'Secret Engine',
      description: 'The name of the secrets engine (mount path)',
      required: true,
      defaultValue: 'secret',
    }),
    listPath: Property.ShortText({
      displayName: 'Path',
      description: 'The path to list secrets from (e.g., myapp/)',
      required: false,
      defaultValue: '',
    }),
  },
  async run(context) {
    const { secretEngine, listPath } = context.propsValue;
    const vaultAuth = await getVaultToken(context.auth);

    const cleanPath = (listPath || '').replace(/^\/+|\/+$/g, '');
    const url = buildSecretUrl(
      vaultAuth.baseUrl,
      secretEngine,
      cleanPath,
      vaultAuth.apiVersion,
      'list'
    ) + '?list=true';

    try {
      const response = await httpClient.sendRequest<{
        data?: { keys?: string[] };
      }>({
        method: HttpMethod.GET,
        url,
        headers: buildVaultHeaders(vaultAuth.token, vaultAuth.namespace),
      });

      return {
        success: true,
        keys: response.body.data?.keys || [],
        path: listPath || '/',
      };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return {
          success: true,
          keys: [],
          path: listPath || '/',
          message: 'No secrets found at this path',
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list secrets: ${errorMessage}`);
    }
  },
});
