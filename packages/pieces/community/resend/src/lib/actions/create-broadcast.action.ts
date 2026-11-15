import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { createBroadcastOutputSchema } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';

export const createBroadcast = createAction({
  name: 'create_broadcast',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Broadcast',
  outputSchema: createBroadcastOutputSchema,
  description: 'Create a new broadcast email to send to an audience',
  audience: 'both',
  aiMetadata: { description: 'Creates a draft broadcast email (subject and body) targeting a Resend audience and returns its ID. Use this to prepare a campaign; it only creates the draft and does not deliver anything — pair it with Send Broadcast to actually send. Requires the audience ID and a sender on a verified domain. Not idempotent — each call creates a new broadcast.', idempotent: false },
  propertyGroups: [
    {
      key: 'audience',
      display: 'section',
      label: 'Send to',
      icon: 'users',
      props: ['info', 'audience_id'],
    },
    {
      key: 'sender',
      display: 'section',
      label: 'Sender',
      icon: 'user',
      props: ['from', 'reply_to'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['subject', 'preview_text', 'content_type', 'content'],
    },
  ],
  props: {
    info: Property.MarkDown({
      value: 'This saves a draft. Use Send Broadcast to send it.',
      variant: MarkdownVariant.INFO,
    }),
    audience_id: resendProps.audienceId,
    from: Property.ShortText({
      displayName: 'From',
      description: 'Must be on a verified domain. Use Name <email> to show a name.',
      placeholder: 'Acme <hello@acme.com>',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Replies go to this address instead of the sender.',
      placeholder: 'support@acme.com',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      placeholder: 'Your March invoice',
      required: true,
    }),
    preview_text: Property.ShortText({
      displayName: 'Preview Text',
      description: 'Shown after the subject line in most inboxes.',
      placeholder: 'Our spring sale starts today',
      required: false,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Plain Text', value: 'text', icon: 'text' },
          { label: 'HTML', value: 'html', icon: 'code' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Body',
      description: 'Write HTML markup when Body Type is HTML.',
      placeholder: 'Hi Jane, thanks for signing up.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Broadcast Name',
      description: 'Only you see this name; recipients do not.',
      placeholder: 'Spring sale',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      audience_id: propsValue.audience_id,
      from: propsValue.from,
      subject: propsValue.subject,
    };
    if (propsValue.content_type === 'html') {
      body['html'] = propsValue.content;
    } else {
      body['text'] = propsValue.content;
    }
    if (propsValue.name) body['name'] = propsValue.name;
    if (propsValue.reply_to) body['reply_to'] = propsValue.reply_to;
    if (propsValue.preview_text) body['preview_text'] = propsValue.preview_text;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/broadcasts', body: body });
  },
});
