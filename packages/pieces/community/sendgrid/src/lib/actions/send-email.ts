import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import { sendgridCommon } from '../common';
import { sendgridAuth } from '../..';
import { Attachment } from 'nodemailer/lib/mailer';
import mime from 'mime-types';

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
    content_type: Property.Dropdown<'text' | 'html', true, typeof sendgridAuth>({
      displayName: 'Content Type',
      refreshers: [],
      required: true,
      auth: sendgridAuth,
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
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'File to attach to the email you want to send',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'In case you want to change the name of the attachment',
          required: false,
        }),
      }
    }),
  },
  async run(context) {
    const { to, from, from_name, reply_to, subject, content_type, content, attachments = [] } =
      context.propsValue;

    const attachment_data: Attachment[] = (attachments as { file: ApFile; name?: string }[])
      .map(({file, name}) => {
        const lookupResult = mime.lookup(
          file.extension ? file.extension : ''
        );
        return {
          filename: name ?? file.filename,
          content: file?.base64,
          type: lookupResult ? lookupResult : undefined,
        };
      });

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${sendgridCommon.baseUrl(context.auth.props?.dataResidency)}/mail/send`,
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
        ...(attachment_data && attachment_data.length > 0 && { attachments: attachment_data }),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props?.apiKey,
      },
      queryParams: {},
    };
    await httpClient.sendRequest(request);

    return {
      success: true,
    };
  },
});
