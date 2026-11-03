import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskListCustomObjectsOutputSchema } from '../../../output-schemas';

export const zendeskListCustomObjects = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_custom_objects',
  outputSchema: zendeskListCustomObjectsOutputSchema,
  displayName: 'List Custom Objects',
  description: 'List the custom object types in the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the custom object types defined in the account, with the key every custom object record action needs. Custom objects require Zendesk Suite or Support Professional and above.',
    idempotent: true,
  },
  props: {
  },
  async run({ auth }) {
    const response = await zendeskApi.request<{ custom_objects: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_objects.json`,
    });
    return { custom_objects: response.custom_objects, count: response.custom_objects.length };
  },
});
