import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const acceptFollowRequest = createAction({
  auth: mastodonAuth,
  name: 'accept_follow_request',
  classification: 'WRITE',
  displayName: 'Accept Follow Request',
  description: 'Accept a pending follow request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Accepts a pending follow request so the requesting account becomes a follower of the connected (locked) account. Get the account ID from List Follow Requests. Repeating the call fails with not found once the request is handled. Returns the updated relationship.',
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
      path: `/api/v1/follow_requests/${encodeURIComponent(context.propsValue.account_id)}/authorize`,
      operation: 'Accept Follow Request',
      scope: 'write:follows',
    });
  },
});
