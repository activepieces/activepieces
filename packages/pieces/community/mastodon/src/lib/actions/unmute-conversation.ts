import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const unmuteConversation = createAction({
  auth: mastodonAuth,
  name: 'unmute_conversation',
  classification: 'WRITE',
  displayName: 'Unmute Conversation',
  description: 'Resume notifications for a muted thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unmutes notifications for the conversation thread a status belongs to. Safe to retry. Returns the updated status.',
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
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/unmute`,
      operation: 'Unmute Conversation',
      scope: 'write:mutes',
    });
  },
});
