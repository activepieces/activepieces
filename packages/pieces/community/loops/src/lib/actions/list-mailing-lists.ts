import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const listMailingLists = createAction({
  name: 'list_mailing_lists',
  classification: 'SEARCH',
  displayName: 'List Mailing Lists',
  description: 'Lists the mailing lists in your Loops account.',
  audience: 'both',
  outputSchema: loopsSchemas.mailingLists,
  aiMetadata: {
    description:
      'Lists Loops mailing lists with their ID, name, description and whether they are public. Use the IDs as keys of mailingLists in create_contact, update_contact or send_event. Loops returns every list at once; offset and limit page through that result. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of lists to skip. Defaults to 0.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of lists to return. Leave empty to return all.',
      required: false,
    }),
  },
  async run(context) {
    const { offset, limit } = context.propsValue;
    const body = await loopsClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/lists',
    });
    const lists = loopsClient.sliceArray({ items: body, offset, limit, what: 'mailing lists' });
    return { lists, count: lists.length };
  },
});
