import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const listContactsAction = createAction({
  auth: firefliesAiAuth,
  name: 'list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'Lists the people the user has had meetings with.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the contacts of the API key owner (people they have met with): email, name and last meeting date, a page at a time. Use the emails as participants in Find Meetings or Ask Fred. Page with offset/next_offset. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.listContacts,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Contacts to return, 1 to 500. Default 100.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Contacts to skip. Default 0. Use next_offset from the previous call.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = firefliesInput.optionalInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 500 }) ?? 100;
    const offset = firefliesInput.optionalInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 10_000_000 }) ?? 0;
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.listContacts,
      operation: 'list contacts',
    });
    const all = firefliesClient.recordList(data['contacts']);
    const contacts = all.slice(offset, offset + limit);
    const end = offset + contacts.length;
    const hasMore = end < all.length;
    return {
      contacts,
      total: all.length,
      offset,
      returned: contacts.length,
      next_offset: hasMore ? end : null,
      has_more: hasMore,
    };
  },
});
