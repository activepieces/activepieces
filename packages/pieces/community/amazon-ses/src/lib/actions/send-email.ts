import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  SendEmailCommand,
  Body,
  Content,
  Destination,
  Message,
} from '@aws-sdk/client-sesv2';

export const sendEmail = createAction({
  auth: amazonSESAuth,
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Send an email using Amazon SES v2',
  props: {
    fromAddress: Property.ShortText({
      displayName: 'From Address',
      description: 'The email address to send from (must be verified in SES)',
      required: true,
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'List of recipient email addresses',
      required: true,
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'List of CC email addresses',
      required: false,
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'List of BCC email addresses',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      description: 'Email body in HTML format',
      required: false,
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      description: 'Email body in plain text format',
      required: false,
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply To Addresses',
      description: 'List of reply-to email addresses',
      required: false,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description: 'Name of the configuration set to use for this email',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      fromAddress,
      toAddresses,
      ccAddresses,
      bccAddresses,
      subject,
      htmlBody,
      textBody,
      replyToAddresses,
      configurationSetName,
    } = propsValue;

    if (!htmlBody && !textBody) {
      throw new Error('Either HTML body or text body must be provided');
    }

    const sesClient = createSES(auth);

    const destination: Destination = {
      ToAddresses: toAddresses as string[],
      ...(ccAddresses &&
        ccAddresses.length > 0 && { CcAddresses: ccAddresses as string[] }),
      ...(bccAddresses &&
        bccAddresses.length > 0 && { BccAddresses: bccAddresses as string[] }),
    };

    const body: Body = {};
    if (htmlBody) {
      body.Html = {
        Data: htmlBody,
        Charset: 'UTF-8',
      } as Content;
    }
    if (textBody) {
      body.Text = {
        Data: textBody,
        Charset: 'UTF-8',
      } as Content;
    }

    const message: Message = {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      } as Content,
      Body: body,
    };

    const sendEmailParams = {
      FromEmailAddress: fromAddress,
      Destination: destination,
      Content: {
        Simple: message,
      },
      ...(replyToAddresses &&
        replyToAddresses.length > 0 && {
          ReplyToAddresses: replyToAddresses as string[],
        }),
      ...(configurationSetName && {
        ConfigurationSetName: configurationSetName,
      }),
    };

    try {
      const command = new SendEmailCommand(sendEmailParams);
      const result = await sesClient.send(command);

      return {
        messageId: result.MessageId,
        success: true,
        timestamp: new Date().toISOString(),
        fromAddress,
        toAddresses,
        subject,
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  },
});
