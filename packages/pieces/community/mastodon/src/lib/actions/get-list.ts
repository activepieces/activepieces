import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { listOutputSchema } from '../output-schemas';

export const getList = createAction({
  auth: mastodonAuth,
  name: 'get_list',
  classification: 'READ',
  displayName: 'Get List',
  description: 'Get one of your lists by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one of the connected account\'s lists by ID (title, replies policy, exclusive flag). Use List Lists to find IDs and List Accounts in List for its members. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/lists/${encodeURIComponent(context.propsValue.list_id)}`,
      operation: 'Get List',
      scope: 'read:lists',
    });
  },
});
