import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const sendEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a fully customizable email via Amazon SES—including sender, subject, body, to/cc/bcc, format, reply-to, and return-path.',
  props: {
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'The email address to use as the "From" address for the email. The address must be verified in SES.',
      required: true,
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'Email addresses to send the message to',
      required: true,
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'Email addresses to carbon copy',
      required: false,
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'Email addresses to blind carbon copy',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email',
      required: true,
    }),
    bodyType: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'Choose whether to send HTML or plain text email',
      required: true,
      options: {
        options: [
          {
            label: 'HTML',
            value: 'html',
          },
          {
            label: 'Plain Text',
            value: 'text',
          },
          {
            label: 'Both HTML and Text',
            value: 'both',
          },
        ],
      },
      defaultValue: 'html',
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      description: 'The HTML content of the email body',
      required: false,
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      description: 'The plain text content of the email body',
      required: false,
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply-To Addresses',
      description: 'Email addresses for replies',
      required: false,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description: 'The name of the configuration set to use when sending the email',
      required: false,
    }),
    emailTags: Property.Array({
      displayName: 'Email Tags',
      description: 'Tags to apply to the email in the format "key=value"',
      required: false,
    }),
    feedbackForwardingEmailAddress: Property.ShortText({
      displayName: 'Feedback Forwarding Email Address',
      description: 'The address that you want bounce and complaint notifications to be sent to',
      required: false,
    }),
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
      emailTags,
      feedbackForwardingEmailAddress,
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
      throw new Error('Both HTML and text bodies are required when body type is both');
    }

    // Create SES client
    const sesClient = new SESv2Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Prepare email content
    const emailContent: any = {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {},
      },
    };

    // Add body content based on type
    if (bodyType === 'html' || bodyType === 'both') {
      emailContent.Simple.Body.Html = {
        Data: htmlBody,
        Charset: 'UTF-8',
      };
    }

    if (bodyType === 'text' || bodyType === 'both') {
      emailContent.Simple.Body.Text = {
        Data: textBody,
        Charset: 'UTF-8',
      };
    }

    // Prepare destination
    const destination: any = {
      ToAddresses: Array.isArray(toAddresses) ? toAddresses : [toAddresses],
    };

    if (ccAddresses && ccAddresses.length > 0) {
      destination.CcAddresses = Array.isArray(ccAddresses) ? ccAddresses : [ccAddresses];
    }

    if (bccAddresses && bccAddresses.length > 0) {
      destination.BccAddresses = Array.isArray(bccAddresses) ? bccAddresses : [bccAddresses];
    }

    // Prepare email tags
    let messageTags: any[] | undefined;
    if (emailTags && emailTags.length > 0) {
      messageTags = emailTags.map((tag: string) => {
        const [name, value] = tag.split('=');
        return { Name: name?.trim(), Value: value?.trim() || '' };
      });
    }

    // Prepare send email command input
    const sendEmailInput: any = {
      FromEmailAddress: fromEmailAddress,
      Destination: destination,
      Content: emailContent,
    };

    // Add optional parameters
    if (replyToAddresses && replyToAddresses.length > 0) {
      sendEmailInput.ReplyToAddresses = Array.isArray(replyToAddresses) ? replyToAddresses : [replyToAddresses];
    }

    if (configurationSetName) {
      sendEmailInput.ConfigurationSetName = configurationSetName;
    }

    if (messageTags && messageTags.length > 0) {
      sendEmailInput.EmailTags = messageTags;
    }

    if (feedbackForwardingEmailAddress) {
      sendEmailInput.FeedbackForwardingEmailAddress = feedbackForwardingEmailAddress;
    }

    try {
      // Send the email
      const command = new SendEmailCommand(sendEmailInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  },
});
