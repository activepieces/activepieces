import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const unboostStatus = createAction({
  auth: mastodonAuth,
  name: 'unboost_status',
  classification: 'WRITE',
  displayName: 'Unboost Status',
  description: 'Undo a boost (reblog) of a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the connected account\'s boost of a status. Pass the original status ID, not the ID of the boost itself. Safe to retry; counts against the rate limit of 30 deletes and unboosts per 30 minutes. Returns the original status.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of the status on this server, for example 109372843234737004. Obtain it from a timeline, Get Status or Search (use resolve for a status URL from another server).',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/unreblog`,
      operation: 'Unboost Status',
      scope: 'write:statuses',
    });
  },
});
