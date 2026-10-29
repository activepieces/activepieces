import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListSecretsOutputSchema } from '../../output-schemas';

export const listSecrets = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_secrets',
  outputSchema: elevenlabsListSecretsOutputSchema,
  displayName: 'List Secrets',
  description: 'List workspace secrets',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists workspace secrets with their ids and names. Values are never returned.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { secrets: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/secrets`,
      queryParams: { search: propsValue.search, page_size: propsValue.pageSize, cursor: propsValue.cursor },
    });
    return { ...response, count: response.secrets.length };
  },
});
