import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hashiCorpVaultAuth } from '../../index';
import { getVaultToken, buildVaultHeaders, buildSecretUrl } from '../common';

export const readSecret = createAction({
  auth: hashiCorpVaultAuth,
  name: 'read_secret',
  displayName: 'Read Secret',
  description: 'Read a secret from HashiCorp Vault',
  props: {
    secretEngine: Property.ShortText({
      displayName: 'Secret Engine',
      description: 'The name of the secrets engine (mount path)',
      required: true,
      defaultValue: 'secret',
    }),
    secretPath: Property.ShortText({
      displayName: 'Secret Path',
      description: 'The path to the secret (e.g., myapp/database)',
      required: true,
    }),
    version: Property.Number({
      displayName: 'Version',
      description: 'Version of the secret to read (0 for latest, KV v2 only)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { secretEngine, secretPath, version } = context.propsValue;
    const vaultAuth = await getVaultToken(context.auth);

    let url = buildSecretUrl(
      vaultAuth.baseUrl,
      secretEngine,
      secretPath,
      vaultAuth.apiVersion,
      'read'
    );

    // Add version parameter for KV v2
    if (vaultAuth.apiVersion === 'v2' && version && version > 0) {
      url += `?version=${version}`;
    }

    try {
      const response = await httpClient.sendRequest<{
        data?: {
          data?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
        lease_duration?: number;
        renewable?: boolean;
      }>({
        method: HttpMethod.GET,
        url,
        headers: buildVaultHeaders(vaultAuth.token, vaultAuth.namespace),
      });

      if (vaultAuth.apiVersion === 'v2') {
        return {
          success: true,
          data: response.body.data?.data || {},
          metadata: response.body.data?.metadata || {},
          lease_duration: response.body.lease_duration,
          renewable: response.body.renewable,
        };
      } else {
        return {
          success: true,
          data: response.body.data || {},
          lease_duration: response.body.lease_duration,
          renewable: response.body.renewable,
        };
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return {
          success: false,
          data: {},
          path: secretPath,
          message: 'Secret not found at this path',
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read secret: ${errorMessage}`);
    }
  },
});
