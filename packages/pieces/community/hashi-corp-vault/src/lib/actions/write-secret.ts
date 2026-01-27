import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hashiCorpVaultAuth } from '../../index';
import { getVaultToken, buildVaultHeaders, buildSecretUrl } from '../common';

export const writeSecret = createAction({
  auth: hashiCorpVaultAuth,
  name: 'write_secret',
  displayName: 'Write Secret',
  description: 'Write a secret to HashiCorp Vault',
  props: {
    secretEngine: Property.ShortText({
      displayName: 'Secret Engine',
      description: 'The name of the secrets engine (mount path)',
      required: true,
      defaultValue: 'secret',
    }),
    secretPath: Property.ShortText({
      displayName: 'Secret Path',
      description: 'The path to store the secret (e.g., myapp/database)',
      required: true,
    }),
    secretData: Property.Json({
      displayName: 'Secret Data',
      description: 'The secret data to store as JSON',
      required: true,
      defaultValue: {
        username: 'myuser',
        password: 'mypassword',
      },
    }),
  },
  async run(context) {
    const { secretEngine, secretPath, secretData } = context.propsValue;
    const vaultAuth = await getVaultToken(context.auth);

    const url = buildSecretUrl(
      vaultAuth.baseUrl,
      secretEngine,
      secretPath,
      vaultAuth.apiVersion,
      'write'
    );

    let requestBody: unknown;
    if (vaultAuth.apiVersion === 'v2') {
      requestBody = { data: secretData };
    } else {
      requestBody = secretData;
    }

    try {
      const response = await httpClient.sendRequest<{
        data?: Record<string, unknown>;
      }>({
        method: HttpMethod.POST,
        url,
        headers: buildVaultHeaders(vaultAuth.token, vaultAuth.namespace),
        body: requestBody,
      });

      return {
        success: true,
        path: secretPath,
        ...(response.body.data && { metadata: response.body.data }),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to write secret: ${errorMessage}`);
    }
  },
});
