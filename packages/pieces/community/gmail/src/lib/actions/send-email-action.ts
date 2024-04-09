import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';

export const gmailSendEmailAction = createAction({
  auth: gmailAuth,
  name: 'send_email',
  description: 'Send an email through a Gmail account',
  displayName: 'Send Email',
  props: {
    receiver: Property.Array({
      displayName: 'Receiver Email (To)',
      description: undefined,
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC Email',
      description: undefined,
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Email',
      description: undefined,
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'plain_text',
      options: {
        disabled: false,
        options: [
          {
            label: 'plain text',
            value: 'plain_text',
          },
          {
            label: 'html',
            value: 'html',
          },
        ],
      },
    }),
    body: Property.ShortText({
      displayName: 'Body',
      description: 'Body for the email you want to send',
      required: true,
    }),
    reply_to: Property.Array({
      displayName: 'Reply-To Email',
      description: 'Email address to set as the "Reply-To" header',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'File to attach to the email you want to send',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'In case you want to change the name of the attachment',
      required: false,
    }),
  },
  async run(configValue) {
    const subjectBase64 = Buffer.from(
      configValue.propsValue['subject']
    ).toString('base64');
    const attachment = configValue.propsValue['attachment'];
    const replyTo = configValue.propsValue['reply_to']?.filter(
      (email) => email !== ''
    );
    const receiver = configValue.propsValue['receiver']?.filter(
      (email) => email !== ''
    );
    const cc = configValue.propsValue['cc']?.filter((email) => email !== '');
    const bcc = configValue.propsValue['bcc']?.filter((email) => email !== '');
    const mailOptions: Mail.Options = {
      to: receiver.join(', '), // Join all email addresses with a comma
      cc: cc ? cc.join(', ') : undefined,
      bcc: bcc ? bcc.join(', ') : undefined,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      replyTo: replyTo ? replyTo.join(', ') : '',
      text:
        configValue.propsValue.body_type === 'plain_text'
          ? configValue.propsValue['body']
          : undefined,
      html:
        configValue.propsValue.body_type === 'html'
          ? configValue.propsValue['body'].replace(/\n/g, '<br>')
          : undefined,
      attachments: [],
    };
    const gmailResponse = await getEmail(configValue.auth.access_token);
    if (gmailResponse?.body?.email && configValue.propsValue['sender_name']) {
      mailOptions.from = `${configValue.propsValue['sender_name']} <${gmailResponse.body.email}>`;
    }

    if (attachment) {
      const lookupResult = mime.lookup(
        attachment.extension ? attachment.extension : ''
      );
      const attachmentOption: Attachment[] = [
        {
          filename: configValue.propsValue.attachment_name ?? attachment.filename ,
          content: attachment?.base64,
          contentType: lookupResult ? lookupResult : undefined,
          encoding: 'base64',
        },
      ];
      mailOptions.attachments = attachmentOption;
    }

    const mail: any = new MailComposer(mailOptions).compile();
    mail.keepBcc = true;
    const mailBody = await mail.build();

    const requestBody: SendEmailRequestBody = {
      raw: Buffer.from(mailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_'),
    };

    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue.auth.access_token,
      },
      queryParams: {},
    };

    return await httpClient.sendRequest(request);
  },
});

function getEmail(idtoken: string | null) {
  // Older connections doesn't have idtoken
  if (!idtoken) {
    return;
  }
  // Get Email from 'email' scope of Google OAuth2
  const request: HttpRequest<Record<string, unknown>> = {
    method: HttpMethod.GET,
    url: `https://www.googleapis.com/oauth2/v3/userinfo`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: idtoken,
    },
    queryParams: {},
  };
  return httpClient.sendRequest<{
    email: string;
  }>(request);
}
type SendEmailRequestBody = {
  /**
   * This is a base64 encoding of the email
   */
  raw: string;
};
