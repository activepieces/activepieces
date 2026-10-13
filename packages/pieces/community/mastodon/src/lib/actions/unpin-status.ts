import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const unpinStatus = createAction({
  auth: mastodonAuth,
  name: 'unpin_status',
  classification: 'WRITE',
  displayName: 'Unpin Status from Profile',
  description: 'Remove a pinned status from your profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unpins one of the connected account\'s statuses from its profile. Safe to retry. Returns the updated status.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of your own status. Obtain it from Create Status, Get Status or List Account Statuses.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/unpin`,
      operation: 'Unpin Status from Profile',
      scope: 'write:accounts',
    });
  },
});
