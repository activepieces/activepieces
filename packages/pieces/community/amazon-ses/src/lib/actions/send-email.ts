import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getVerifiedIdentities,
  getConfigurationSets,
  createSESClient,
  validateEmailAddresses,
  validateRecipientLimits,
  htmlToText,
  formatEmailTags,
  getSESErrorMessage,
  createIdentityDropdownOptions,
  createConfigSetDropdownOptions,
  isValidEmail,
} from '../common/ses-utils';

export const sendEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Send a customizable email via Amazon SES with verified sender addresses',
  props: {
    fromEmailAddress: Property.Dropdown({
      displayName: 'From Email',
      description: 'Verified sender email address',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const verifiedIdentities = await getVerifiedIdentities(auth as any);
        return createIdentityDropdownOptions(verifiedIdentities);
      },
    }),
    toAddresses: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses',
      required: true,
    }),
    ccAddresses: Property.Array({
      displayName: 'CC',
      description: 'Carbon copy recipients',
      required: false,
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC',
      description: 'Blind carbon copy recipients',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    bodyFormat: Property.StaticDropdown({
      displayName: 'Email Format',
      description: 'Choose email format',
      required: true,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'text' },
        ],
      },
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Content',
      description: 'HTML email content (auto-generates text version)',
      required: false,
    }),
    textBody: Property.LongText({
      displayName: 'Text Content',
      description: 'Plain text email content',
      required: false,
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply To',
      description: 'Reply-to email addresses',
      required: false,
    }),
    returnPath: Property.ShortText({
      displayName: 'Return Path',
      description: 'Email address for bounce notifications',
      required: false,
    }),
    configurationSetName: Property.Dropdown({
      displayName: 'Configuration Set',
      description: 'SES configuration set for tracking',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const configSets = await getConfigurationSets(auth as any);
        return createConfigSetDropdownOptions(configSets);
      },
    }),
    emailTags: Property.Object({
      displayName: 'Email Tags',
      description: 'Key-value pairs for email tracking and analytics',
      required: false,
    }),
    sourceArn: Property.ShortText({
      displayName: 'Source ARN',
      description: 'ARN for sending authorization (advanced)',
      required: false,
    }),
    returnPathArn: Property.ShortText({
      displayName: 'Return Path ARN',
      description: 'ARN for return path authorization (advanced)',
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
      bodyFormat,
      htmlBody,
      textBody,
      replyToAddresses,
      returnPath,
      configurationSetName,
      emailTags,
      sourceArn,
      returnPathArn,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    if (bodyFormat === 'html' && !htmlBody) {
      throw new Error('HTML content is required when using HTML format');
    }
    if (bodyFormat === 'text' && !textBody) {
      throw new Error('Text content is required when using plain text format');
    }

    const validatedToAddresses = validateEmailAddresses(
      toAddresses as string[],
      'To addresses'
    );
    const validatedCcAddresses = validateEmailAddresses(
      ccAddresses as string[],
      'CC addresses'
    );
    const validatedBccAddresses = validateEmailAddresses(
      bccAddresses as string[],
      'BCC addresses'
    );
    const validatedReplyToAddresses = validateEmailAddresses(
      replyToAddresses as string[],
      'Reply-to addresses'
    );

    validateRecipientLimits(
      validatedToAddresses,
      validatedCcAddresses,
      validatedBccAddresses
    );

    if (returnPath && !isValidEmail(returnPath)) {
      throw new Error(`Invalid return path email: ${returnPath}`);
    }

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    const emailBody: any = {};

    if (bodyFormat === 'html') {
      emailBody.Html = {
        Charset: 'UTF-8',
        Data: htmlBody,
      };
      emailBody.Text = {
        Charset: 'UTF-8',
        Data: htmlToText(htmlBody as string),
      };
    } else {
      emailBody.Text = {
        Charset: 'UTF-8',
        Data: textBody,
      };
    }

    const messageTags = formatEmailTags(emailTags as Record<string, string>);

    const sendEmailCommand = new SendEmailCommand({
      Source: fromEmailAddress,
      Destination: {
        ToAddresses: validatedToAddresses,
        ...(validatedCcAddresses.length > 0 && {
          CcAddresses: validatedCcAddresses,
        }),
        ...(validatedBccAddresses.length > 0 && {
          BccAddresses: validatedBccAddresses,
        }),
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
        Body: emailBody,
      },
      ...(validatedReplyToAddresses.length > 0 && {
        ReplyToAddresses: validatedReplyToAddresses,
      }),
      ...(returnPath && { ReturnPath: returnPath }),
      ...(configurationSetName &&
        configurationSetName.trim() && {
          ConfigurationSetName: configurationSetName,
        }),
      ...(messageTags && { Tags: messageTags }),
      ...(sourceArn && { SourceArn: sourceArn }),
      ...(returnPathArn && { ReturnPathArn: returnPathArn }),
    });

    try {
      const response = await sesClient.send(sendEmailCommand);

      const totalRecipients =
        validatedToAddresses.length +
        validatedCcAddresses.length +
        validatedBccAddresses.length;

      return {
        success: true,
        messageId: response.MessageId,
        message: 'Email sent successfully',
        recipientCount: totalRecipients,
        format: bodyFormat,
        toAddresses: validatedToAddresses,
        ccAddresses: validatedCcAddresses,
        bccAddresses: validatedBccAddresses,
      };
    } catch (error: any) {
      const errorMessage = getSESErrorMessage(error, configurationSetName);
      throw new Error(errorMessage);
    }
  },
});
