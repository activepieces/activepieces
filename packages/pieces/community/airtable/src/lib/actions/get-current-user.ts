import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { getCurrentUserActionOutputSchema } from '../output-schemas';

export const airtableGetCurrentUserAction = createAction({
  auth: airtableAuth,
  name: 'get_current_user',
  displayName: 'Get Current User (Agent)',
  description: 'Get the connected token identity and its scopes.',
  audience: 'ai',
  outputSchema: getCurrentUserActionOutputSchema,
  aiMetadata: {
    description:
      'Returns the identity of the connected personal access token — its user id, and (where exposed) the scopes the token carries. Use to confirm which account is connected and which permissions are available before attempting scope-gated operations. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://api.airtable.com/v0/meta/whoami',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    };

    try {
      const response = await httpClient.sendRequest<{
        id: string;
        email?: string;
        scopes?: string[];
      }>(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the request (401/403). The personal access token is invalid or revoked.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
