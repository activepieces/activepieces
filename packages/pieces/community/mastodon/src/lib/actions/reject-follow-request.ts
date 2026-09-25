import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const rejectFollowRequest = createAction({
  auth: mastodonAuth,
  name: 'reject_follow_request',
  classification: 'WRITE',
  displayName: 'Reject Follow Request',
  description: 'Reject a pending follow request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rejects a pending follow request to the connected (locked) account. Get the account ID from List Follow Requests. Repeating the call fails with not found once the request is handled. Returns the updated relationship.',
    idempotent: false,
  },
  outputSchema: relationshipOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account that requested to follow you. Obtain it from List Follow Requests.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/follow_requests/${encodeURIComponent(context.propsValue.account_id)}/reject`,
      operation: 'Reject Follow Request',
      scope: 'write:follows',
    });
  },
});
