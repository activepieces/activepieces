import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const sendEmail = createAction({
  auth: resendAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text or HTML email',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Sender name',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email (From)',
      description: 'Sender email',
      required: true,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'List of emails in bcc',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'List of emails in cc',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email to receive replies on (defaults to sender)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      required: true,
    }),
    content_type: Property.Dropdown<'text' | 'html'>({
      displayName: 'Content Type',
      refreshers: [],
      required: true,
      defaultValue: 'html',
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'HTML', value: 'html' },
          ],
        };
      },
    }),
    content: Property.ShortText({
      displayName: 'Content',
      description: 'HTML is only allowed if you selected HTML as type',
      required: true,
    }),
  },
  async run(context) {
    const {
      to,
      from,
      from_name,
      reply_to,
      subject,
      content_type,
      content,
      cc,
      bcc,
    } = context.propsValue;
    const requestBody: Record<string, unknown> = {
      to,
      from: from_name ? `${from_name} <${from}>` : from,
      reply_to: reply_to ?? from,
      cc,
      bcc,
      subject: subject,
    };
    if (content_type === 'text') {
      requestBody['text'] = content;
    } else if (content_type === 'html') {
      requestBody['html'] = content;
    }
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.resend.com/emails`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {},
    });
  },
});
