import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusContextOutputSchema } from '../output-schemas';

export const getStatusContext = createAction({
  auth: mastodonAuth,
  name: 'get_status_context',
  classification: 'READ',
  displayName: 'Get Status Thread',
  description: 'Get the ancestors and replies of a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the conversation thread around a status: its ancestors (the posts it replies to) and descendants (replies). Use it to read a whole discussion before replying; use Get Status for just the one post. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusContextOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of the status whose thread to read. Obtain it from a timeline, Get Status or Search.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/context`,
      operation: 'Get Status Thread',
      scope: 'read:statuses',
    });
  },
});
