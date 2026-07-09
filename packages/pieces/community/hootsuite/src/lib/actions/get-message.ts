import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hootsuiteAuth } from '../auth';
import { hootsuiteApiCall } from '../common';

export const getMessageAction = createAction({
  auth: hootsuiteAuth,
  name: 'get_message',
  displayName: 'Get Post Details',
  description: 'Retrieves the details of a specific scheduled or published post by its ID.',
  audience: 'both',
  aiMetadata: { description: 'Looks up a single Hootsuite post by its ID and returns its current details and state (e.g. scheduled, sent, errored). Use to inspect or confirm a post created earlier or referenced from the dashboard. Idempotent read-only lookup. Requires the post ID, obtainable from a Schedule Post output or the Hootsuite dashboard URL.', idempotent: true },
  props: {
    messageId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The unique ID of the post. You can get this from a previous "Schedule Post" action output or from the Hootsuite dashboard URL.',
      required: true,
    }),
  },
  async run(context) {
    const response = await hootsuiteApiCall<MessageResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/messages/${context.propsValue.messageId}`,
    });

    const msg = response.body.data;
    return {
      id: msg.id,
      state: msg.state,
      text: msg.text ?? null,
      scheduled_send_time: msg.scheduledSendTime ?? null,
      send_time: msg.sendTime ?? null,
      social_profile_ids: (msg.socialProfileIds ?? []).join(', '),
      post_url: msg.postUrl ?? null,
      tags: msg.tags ?? [],
      email_notification: msg.emailNotification ?? null,
      location: msg.location ?? null,
      errors: msg.errors ?? [],
    };
  },
});

type MessageData = {
  id: string;
  state: string;
  text?: string;
  scheduledSendTime?: string;
  sendTime?: string;
  socialProfileIds?: string[];
  postUrl?: string;
  tags?: string[];
  emailNotification?: boolean;
  location?: { latitude: number; longitude: number };
  errors?: unknown[];
};

type MessageResponse = {
  data: MessageData;
};
