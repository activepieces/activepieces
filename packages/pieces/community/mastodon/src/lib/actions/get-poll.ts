import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { pollOutputSchema } from '../output-schemas';

export const getPoll = createAction({
  auth: mastodonAuth,
  name: 'get_poll',
  classification: 'READ',
  displayName: 'Get Poll',
  description: 'Get a poll with its current results.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a poll by ID with its options, vote counts, expiry and whether the connected account has voted. Use Vote in Poll to vote. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: pollOutputSchema,
  props: {
    poll_id: Property.ShortText({
      displayName: 'Poll ID',
      description:
        'ID of the poll (the poll.id field of a status). Obtain it from Get Status or a timeline.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/polls/${encodeURIComponent(context.propsValue.poll_id)}`,
      operation: 'Get Poll',
      scope: 'read:statuses',
    });
  },
});
