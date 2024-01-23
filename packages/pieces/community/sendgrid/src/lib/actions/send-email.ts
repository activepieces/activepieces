import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import { sendgridCommon } from '../common';
import { sendgridAuth } from '../..';

export const sendEmail = createAction({
  auth: sendgridAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text or HTML email',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From (Email)',
      description: 'Sender email, must be on your SendGrid',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From (Name)',
      description: 'Sender name',
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
    const { to, from, from_name, reply_to, subject, content_type, content } =
      context.propsValue;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${sendgridCommon.baseUrl}/mail/send`,
      body: {
        personalizations: to.map((x) => {
          return {
            to: [
              {
                email: (x as string).trim(),
              },
            ],
          };
        }),
        from: {
          email: from,
          name: from_name,
        },
        reply_to: {
          email: reply_to ?? from,
        },
        subject: subject,
        content: [
          {
            type: content_type == 'text' ? 'text/plain' : 'text/html',
            value: content,
          },
        ],
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {},
    };
    await httpClient.sendRequest(request);

    return {
      success: true,
    };
  },
});
