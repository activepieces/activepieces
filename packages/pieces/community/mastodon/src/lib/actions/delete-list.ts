import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { listAcknowledgementOutputSchema } from '../output-schemas';

export const deleteList = createAction({
  auth: mastodonAuth,
  name: 'delete_list',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete List',
  description: 'Delete one of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one of the connected account\'s lists (the accounts in it are not affected). Irreversible; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: listAcknowledgementOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/lists/${encodeURIComponent(context.propsValue.list_id)}`,
      operation: 'Delete List',
      scope: 'write:lists',
    });
    return { success: true, list_id: context.propsValue.list_id };
  },
});
