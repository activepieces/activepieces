import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hashiCorpVaultAuth } from '../../index';
import { getVaultToken, buildVaultHeaders, buildSecretUrl } from '../common';

export const deleteSecret = createAction({
  auth: hashiCorpVaultAuth,
  name: 'delete_secret',
  displayName: 'Delete Secret',
  description: 'Delete a secret from HashiCorp Vault',
  props: {
    secretEngine: Property.ShortText({
      displayName: 'Secret Engine',
      description: 'The name of the secrets engine (mount path)',
      required: true,
      defaultValue: 'secret',
    }),
    secretPath: Property.ShortText({
      displayName: 'Secret Path',
      description: 'The path to the secret to delete (e.g., myapp/database)',
      required: true,
    }),
  },
  async run(context) {
    const { secretEngine, secretPath } = context.propsValue;
    const vaultAuth = await getVaultToken(context.auth);

    const url = buildSecretUrl(
      vaultAuth.baseUrl,
      secretEngine,
      secretPath,
      vaultAuth.apiVersion,
      'delete'
    );

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url,
        headers: buildVaultHeaders(vaultAuth.token, vaultAuth.namespace),
      });

      return {
        success: true,
        deleted: true,
        path: secretPath,
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
          deleted: false,
          path: secretPath,
          message: 'Secret not found at this path (may already be deleted)',
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete secret: ${errorMessage}`);
    }
  },
});
