import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput
} from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';

export const sendEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Send a fully customizable email via Amazon SES—including sender, subject, body, to/cc/bcc, format, reply-to, and return-path.',
  props: {
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description:
        'The email address to use as the "From" address for the email. The address must be verified in SES.',
      required: true
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'Email addresses to send the message to',
      required: true
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'Email addresses to carbon copy',
      required: false
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'Email addresses to blind carbon copy',
      required: false
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email',
      required: true
    }),
    bodyType: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'Choose whether to send HTML or plain text email',
      required: true,
      options: {
        options: [
          {
            label: 'HTML',
            value: 'html'
          },
          {
            label: 'Plain Text',
            value: 'text'
          },
          {
            label: 'Both HTML and Text',
            value: 'both'
          }
        ]
      },
      defaultValue: 'html'
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      description: 'The HTML content of the email body',
      required: false
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      description: 'The plain text content of the email body',
      required: false
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply-To Addresses',
      description: 'Email addresses for replies',
      required: false
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description:
        'The name of the configuration set to use when sending the email',
      required: false
    }),
    emailTags: Property.Array({
      displayName: 'Email Tags',
      description: 'Tags to apply to the email in the format "key=value"',
      required: false
    })
  },
  async run(context) {
    const {
      fromEmailAddress,
      toAddresses,
      ccAddresses,
      bccAddresses,
      subject,
      bodyType,
      htmlBody,
      textBody,
      replyToAddresses,
      configurationSetName,
      emailTags
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Validate body content based on type
    if (bodyType === 'html' && !htmlBody) {
      throw new Error('HTML body is required when body type is HTML');
    }
    if (bodyType === 'text' && !textBody) {
      throw new Error('Text body is required when body type is plain text');
    }
    if (bodyType === 'both' && (!htmlBody || !textBody)) {
      throw new Error(
        'Both HTML and text bodies are required when body type is both'
      );
    }

    // Create SES client
    const sesClient = new SESClient({
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      region
    });

    // Prepare destination addresses with proper typing
    const destination: SendEmailCommandInput['Destination'] = {
      ToAddresses: Array.isArray(toAddresses)
        ? (toAddresses as string[])
        : [toAddresses as string]
    };

    if (ccAddresses && ccAddresses.length > 0) {
      destination.CcAddresses = Array.isArray(ccAddresses)
        ? (ccAddresses as string[])
        : [ccAddresses as string];
    }

    if (bccAddresses && bccAddresses.length > 0) {
      destination.BccAddresses = Array.isArray(bccAddresses)
        ? (bccAddresses as string[])
        : [bccAddresses as string];
    }

    // Create send email command following AWS SDK example structure exactly
    const sendEmailCommand = new SendEmailCommand({
      Destination: destination,
      Message: {
        Body: {
          ...(bodyType === 'html' || bodyType === 'both'
            ? {
                Html: {
                  Charset: 'UTF-8',
                  Data: htmlBody as string
                }
              }
            : {}),
          ...(bodyType === 'text' || bodyType === 'both'
            ? {
                Text: {
                  Charset: 'UTF-8',
                  Data: textBody as string
                }
              }
            : {})
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: fromEmailAddress,
      ...(replyToAddresses && replyToAddresses.length > 0
        ? {
            ReplyToAddresses: Array.isArray(replyToAddresses)
              ? (replyToAddresses as string[])
              : [replyToAddresses as string]
          }
        : {}),
      ...(configurationSetName
        ? {
            ConfigurationSetName: configurationSetName
          }
        : {}),
      ...(emailTags && emailTags.length > 0
        ? {
            Tags: (emailTags as string[]).map((tag: string) => {
              const [name, value] = tag.split('=');
              return { Name: name?.trim(), Value: value?.trim() || '' };
            })
          }
        : {})
    });

    try {
      const response = await sesClient.send(sendEmailCommand);

      return {
        success: true,
        messageId: response.MessageId,
        message: 'Email sent successfully'
      };
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'MessageRejected') {
        // Following the example pattern for MessageRejected errors
        return caught;
      }
      throw caught;
    }
  }
});
