import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getVerifiedIdentities,
  getConfigurationSets,
  getEmailTemplates,
  createSESClient,
  validateEmailAddresses,
  validateRecipientLimits,
  formatEmailTags,
  getSESErrorMessage,
  createIdentityDropdownOptions,
  createConfigSetDropdownOptions,
} from '../common/ses-utils';

export const sendTemplatedEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_templated_email',
  displayName: 'Send Templated Email',
  description: 'Send personalized emails using pre-created templates',
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
    templateName: Property.Dropdown({
      displayName: 'Email Template',
      description: 'Select template to use for this email',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const templates = await getEmailTemplates(auth as any);

        if (templates.length === 0) {
          return {
            disabled: false,
            placeholder: 'No templates found. Create a template first.',
            options: [],
          };
        }

        return {
          disabled: false,
          options: templates.map((template) => ({
            label: template,
            value: template,
          })),
        };
      },
    }),
    templateData: Property.Object({
      displayName: 'Template Variables',
      description:
        'Data to replace template variables (e.g., {"firstName": "John", "company": "Acme"})',
      required: true,
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
      templateName,
      templateData,
      toAddresses,
      ccAddresses,
      bccAddresses,
      replyToAddresses,
      returnPath,
      configurationSetName,
      emailTags,
      sourceArn,
      returnPathArn,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    if (
      !templateData ||
      Object.keys(templateData as Record<string, any>).length === 0
    ) {
      throw new Error(
        'Template variables are required. Provide at least one key-value pair.'
      );
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

    if (
      returnPath &&
      !validateEmailAddresses([returnPath], 'Return path').length
    ) {
      throw new Error(`Invalid return path email: ${returnPath}`);
    }

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    let templateDataString: string;
    try {
      templateDataString = JSON.stringify(templateData);
      JSON.parse(templateDataString);
    } catch (error) {
      throw new Error(
        'Template data must be a valid object with key-value pairs'
      );
    }

    const messageTags = formatEmailTags(emailTags as Record<string, string>);

    const sendTemplatedEmailCommand = new SendTemplatedEmailCommand({
      Source: fromEmailAddress,
      Template: templateName,
      TemplateData: templateDataString,
      Destination: {
        ToAddresses: validatedToAddresses,
        ...(validatedCcAddresses.length > 0 && {
          CcAddresses: validatedCcAddresses,
        }),
        ...(validatedBccAddresses.length > 0 && {
          BccAddresses: validatedBccAddresses,
        }),
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
      const response = await sesClient.send(sendTemplatedEmailCommand);

      const totalRecipients =
        validatedToAddresses.length +
        validatedCcAddresses.length +
        validatedBccAddresses.length;

      return {
        success: true,
        messageId: response.MessageId,
        message: 'Templated email sent successfully',
        templateName,
        templateData: JSON.parse(templateDataString),
        recipientCount: totalRecipients,
        toAddresses: validatedToAddresses,
        ccAddresses: validatedCcAddresses,
        bccAddresses: validatedBccAddresses,
        variablesUsed: Object.keys(templateData as Record<string, any>),
      };
    } catch (error: any) {
      if (error.name === 'TemplateDoesNotExistException') {
        throw new Error(
          `Template "${templateName}" does not exist. Please create it first or select a different template.`
        );
      }

      const errorMessage = getSESErrorMessage(error, configurationSetName);
      throw new Error(errorMessage);
    }
  },
});
