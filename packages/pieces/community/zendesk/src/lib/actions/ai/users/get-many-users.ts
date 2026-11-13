import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskGetManyUsersOutputSchema } from '../../../output-schemas';

export const zendeskGetManyUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_many_users',
  outputSchema: zendeskGetManyUsersOutputSchema,
  displayName: 'Get Many Users',
  description: 'Get up to 100 users by their IDs or external IDs.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches up to 100 users in one request, by numeric User IDs or by External IDs (pass one of the two). Prefer it over repeated Get User calls. Unknown IDs are left out, so compare count with the number requested.',
    idempotent: true,
  },
  props: {
    user_ids: Property.Array({ displayName: 'User IDs', description: 'Up to 100 numeric user IDs.', required: false }),
    external_ids: Property.Array({ displayName: 'External IDs', description: 'Up to 100 user external IDs.', required: false }),
  },
  async run({ auth, propsValue }) {
    const externalIds = zendeskApi.stringList(propsValue.external_ids);
    const hasUserIds = zendeskApi.stringList(propsValue.user_ids).length > 0;
    if (hasUserIds === externalIds.length > 0) {
      throw new Error('Pass either User IDs or External IDs, not both or neither.');
    }
    if (externalIds.length > 100) {
      throw new Error(`External IDs accepts at most 100 IDs per call, got ${externalIds.length}.`);
    }
    const response = await zendeskApi.request<{ users: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/users/show_many.json',
      queryParams: hasUserIds
        ? { ids: zendeskApi.idList({ values: propsValue.user_ids, label: 'User IDs', max: 100 }).join(',') }
        : { external_ids: externalIds.join(',') },
    });
    return { users: response.users, count: response.users.length };
  },
});
