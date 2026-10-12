import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const muteConversation = createAction({
  auth: mastodonAuth,
  name: 'mute_conversation',
  classification: 'WRITE',
  displayName: 'Mute Conversation',
  description: 'Stop receiving notifications for a thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Mutes notifications from the conversation thread a status belongs to, for a thread the connected account participates in. Use Mute Account to silence a person instead. Safe to retry. Returns the updated status.',
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
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/mute`,
      operation: 'Mute Conversation',
      scope: 'write:mutes',
    });
  },
});
