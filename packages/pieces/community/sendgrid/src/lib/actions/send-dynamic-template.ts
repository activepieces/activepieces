import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { sendgridCommon } from '../common';
import { sendgridAuth } from '../..';
import { Attachment } from 'nodemailer/lib/mailer';
import mime from 'mime-types';

export const sendDynamicTemplate = createAction({
  auth: sendgridAuth,
  name: 'send_dynamic_template',
  displayName: 'Send Dynamic Template',
  description: 'Send an email using a dynamic template',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From (Name)',
      description: 'Sender name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From (Email)',
      description: 'Sender email, must be on your SendGrid',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template Id',
      description: 'Dynamic template id',
      required: true,
    }),
    template_data: Property.Json({
      displayName: 'Template Data',
      description: 'Dynamic template data',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email to receive replies on (defaults to sender)',
      required: false,
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
    const { to, from, template_id, template_data, reply_to, from_name, attachments = [] } =
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

    const message = {
      personalizations: to.map((email) => ({
        to: [{ email: (email as string).trim() }],
        dynamic_template_data: template_data,
      })),
      from: { email: from, name: from_name },
      reply_to: { email: reply_to ?? from },
      template_id,
      ...(attachment_data && attachment_data.length > 0 && { attachments: attachment_data }),
    };

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${sendgridCommon.baseUrl(context.auth.props?.dataResidency)}/mail/send`,
      body: message,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props?.apiKey,
      },
      queryParams: {},
    });
    return {
      success: true,
    };
  },
});
