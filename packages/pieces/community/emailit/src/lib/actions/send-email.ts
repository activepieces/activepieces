import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { emailitAuth } from '../..';

export const sendEmail = createAction({
  auth: emailitAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text or HTML email using EmailIt API v2',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Email addresses of the recipients (up to 50 total across TO, CC, BCC)',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'The name of the sender',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'Sender Email',
      description: 'The email address of the sender',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Email addresses for carbon copy',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Email addresses for blind carbon copy',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To',
      description: 'Email address to receive replies (defaults to sender)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The email subject line',
      required: true,
    }),
    content_type: Property.StaticDropdown<'text' | 'html'>({
      displayName: 'Content Type',
      required: true,
      defaultValue: 'html',
      options: {
        disabled: false,
        options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'HTML', value: 'html' },
          ],
        },
      
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The email body content',
      required: true,
    }),
    track_opens: Property.Checkbox({
      displayName: 'Track Opens',
      description: 'Enable open tracking (overrides domain defaults)',
      required: false,
      defaultValue: false,
    }),
    track_clicks: Property.Checkbox({
      displayName: 'Track Clicks',
      description: 'Enable click tracking (overrides domain defaults)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      to,
      from_name,
      from_email,
      cc,
      bcc,
      reply_to,
      subject,
      content_type,
      content,
      track_opens,
      track_clicks,
    } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      from: from_name ? `${from_name} <${from_email}>` : from_email,
      to: to,
      subject: subject,
    };

    if (content_type === 'text') {
      requestBody['text'] = content;
    } else {
      requestBody['html'] = content;
    }

    if (cc && cc.length > 0) {
      requestBody['cc'] = cc;
    }

    if (bcc && bcc.length > 0) {
      requestBody['bcc'] = bcc;
    }

    if (reply_to) {
      requestBody['reply_to'] = reply_to;
    }

    if (track_opens !== undefined) {
      requestBody['track_opens'] = track_opens;
    }

    if (track_clicks !== undefined) {
      requestBody['track_clicks'] = track_clicks;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.emailit.com/v2/emails',
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
  },
});
