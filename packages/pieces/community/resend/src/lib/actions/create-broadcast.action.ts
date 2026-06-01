import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const createBroadcast = createAction({
  name: 'create_broadcast',
  auth: resendAuth,
  displayName: 'Create Broadcast',
  description: 'Create a new broadcast email to send to an audience',
  props: {
    audience_id: resendProps.audienceId,
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender address. Must be from a verified domain. Use "Name <email@yourdomain.com>" for a friendly name.',
      required: true,
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    name: Property.ShortText({
      displayName: 'Broadcast Name',
      description: 'Internal label for this broadcast. Not visible to recipients.',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email address recipients will reply to.',
      required: false,
    }),
    preview_text: Property.ShortText({
      displayName: 'Preview Text',
      description: 'Short summary shown in email clients below the subject line.',
      required: false,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      required: true,
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'text' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Email body. Use HTML markup if Content Type is HTML.',
      required: true,
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

    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.POST,
      url: 'https://api.resend.com/broadcasts',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body,
    });
    return response.body;
  },
});
