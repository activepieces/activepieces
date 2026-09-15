import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { updateBroadcastOutputSchema } from '../output-schemas';

export const updateBroadcast = createAction({
  name: 'update_broadcast',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Broadcast',
  outputSchema: updateBroadcastOutputSchema,
  description: "Update an unsent broadcast's content or targeting",
  audience: 'ai',
  aiMetadata: { description: "Updates the sender, subject, reply-to, body, name, or audience/topic targeting of an existing broadcast that has not been sent yet, identified by broadcast ID. Only supplied fields change; anything left blank keeps its current value. Not usable once the broadcast has been sent. Idempotent — re-applying the same values leaves the broadcast unchanged.", idempotent: true },
  props: {
    broadcast_id: resendProps.broadcastId,
    segment_id: Property.ShortText({
      displayName: 'Segment ID',
      description: "Send to this segment instead of the broadcast's current audience. Obtain from List Segments.",
      required: false,
    }),
    topic_id: Property.ShortText({
      displayName: 'Topic ID',
      description: 'Scope the broadcast to contacts subscribed to this topic. Obtain from List Topics.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender address. Must be from a verified domain.',
      required: false,
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email address recipients will reply to.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Broadcast Name',
      description: 'Internal label for this broadcast. Not visible to recipients.',
      required: false,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Leave blank to keep the existing body unchanged.',
      required: false,
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'text' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New email body. Requires Content Type to be set.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.segment_id) body['segment_id'] = propsValue.segment_id;
    if (propsValue.topic_id) body['topic_id'] = propsValue.topic_id;
    if (propsValue.from) body['from'] = propsValue.from;
    if (propsValue.subject) body['subject'] = propsValue.subject;
    if (propsValue.reply_to) body['reply_to'] = propsValue.reply_to;
    if (propsValue.name) body['name'] = propsValue.name;
    if (propsValue.content_type === 'html' && propsValue.content) {
      body['html'] = propsValue.content;
    } else if (propsValue.content_type === 'text' && propsValue.content) {
      body['text'] = propsValue.content;
    }

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/broadcasts/${propsValue.broadcast_id}`, body: body });
  },
});
