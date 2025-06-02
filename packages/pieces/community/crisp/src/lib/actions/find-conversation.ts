import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../../index';

interface CrispAuth {
  identifier: string;
  key: string;
}

export const findConversation = createAction({
  auth: crispAuth,
  name: 'findConversation',
  displayName: 'Find Conversation',
  description: 'Get detailed information about a specific conversation',
  props: {
    website_id: Property.ShortText({
      displayName: 'Website ID',
      description: 'The website identifier',
      required: true,
    }),
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'The conversation session identifier',
      required: true,
    }),
  },
  async run(context) {
    const { website_id, session_id } = context.propsValue;
    const auth = context.auth as CrispAuth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.crisp.chat/v1/website/${website_id}/conversation/${session_id}`,
      headers: {
        'X-Crisp-Tier': 'plugin',
        'Authorization': `Basic ${Buffer.from(
          `${auth.identifier}:${auth.key}`
        ).toString('base64')}`,
      },
    });

    if (response.body.error) {
      throw new Error(response.body.reason || 'Failed to find conversation');
    }

    const conversation = response.body.data;
    return {
      session_id: conversation.session_id,
      website_id: conversation.website_id,
      inbox_id: conversation.inbox_id,
      people_id: conversation.people_id,
      state: conversation.state,
      status: conversation.status,
      is_verified: conversation.is_verified,
      is_blocked: conversation.is_blocked,
      availability: conversation.availability,
      active: conversation.active,
      last_message: conversation.last_message,
      preview_message: {
        type: conversation.preview_message?.type,
        from: conversation.preview_message?.from,
        excerpt: conversation.preview_message?.excerpt,
        fingerprint: conversation.preview_message?.fingerprint,
      },
      topic: conversation.topic,
      mentions: conversation.mentions,
      participants: conversation.participants,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      waiting_since: conversation.waiting_since,
      compose: conversation.compose,
      unread: conversation.unread,
      assigned: conversation.assigned,
      meta: {
        nickname: conversation.meta?.nickname,
        email: conversation.meta?.email,
        phone: conversation.meta?.phone,
        address: conversation.meta?.address,
        subject: conversation.meta?.subject,
        origin: conversation.meta?.origin,
        ip: conversation.meta?.ip,
        avatar: conversation.meta?.avatar,
        device: conversation.meta?.device,
      },
      segments: conversation.segments,
    };
  },
});
