import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SESClient,
  SendCustomVerificationEmailCommand,
} from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getConfigurationSets,
  getCustomVerificationTemplates,
  createSESClient,
  validateEmailAddresses,
  getCustomVerificationErrorMessage,
  getSESErrorMessage,
  createConfigSetDropdownOptions,
  isValidEmail,
} from '../common/ses-utils';

export const sendCustomVerificationEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_custom_verification_email',
  displayName: 'Send Custom Verification Email',
  description:
    'Send verification email to add an email address to SES identities',
  props: {
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to verify and add to identities',
      required: true,
    }),
    templateName: Property.Dropdown({
      displayName: 'Verification Template',
      description: 'Select custom verification email template',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const templates = await getCustomVerificationTemplates(auth as any);

        if (templates.length === 0) {
          return {
            disabled: false,
            placeholder:
              'No custom verification templates found. Create one first.',
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
    configurationSetName: Property.Dropdown({
      displayName: 'Configuration Set',
      description: 'SES configuration set for tracking (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const configSets = await getConfigurationSets(auth as any);
        return createConfigSetDropdownOptions(configSets);
      },
    }),
    validateEmailFormat: Property.Checkbox({
      displayName: 'Validate Email Format',
      description: 'Check email address format before sending',
      required: false,
      defaultValue: true,
    }),
    checkExistingIdentity: Property.Checkbox({
      displayName: 'Check if Already Verified',
      description: 'Warn if email is already a verified identity',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      emailAddress,
      templateName,
      configurationSetName,
      validateEmailFormat,
      checkExistingIdentity,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    if (validateEmailFormat) {
      const validatedEmails = validateEmailAddresses(
        [emailAddress],
        'Email address'
      );
      if (validatedEmails.length === 0) {
        throw new Error(`Invalid email address format: ${emailAddress}`);
      }
    }

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    if (checkExistingIdentity) {
      try {
        const { getVerifiedIdentities } = await import('../common/ses-utils');
        const verifiedIdentities = await getVerifiedIdentities({
          accessKeyId,
          secretAccessKey,
          region,
        });

        if (verifiedIdentities.includes(emailAddress)) {
          console.warn(
            `Email address ${emailAddress} is already a verified identity`
          );
        }
      } catch (error) {
        console.warn('Could not check existing identities:', error);
      }
    }

    const emailDomain = emailAddress.split('@')[1];
    const isCommonDomain = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ].includes(emailDomain?.toLowerCase());

    const sendCommand = new SendCustomVerificationEmailCommand({
      EmailAddress: emailAddress.trim(),
      TemplateName: templateName,
      ...(configurationSetName &&
        configurationSetName.trim() && {
          ConfigurationSetName: configurationSetName,
        }),
    });

    try {
      const response = await sesClient.send(sendCommand);

      return {
        success: true,
        messageId: response.MessageId,
        message: 'Custom verification email sent successfully',
        emailAddress: emailAddress.trim(),
        templateName,
        configurationSetName: configurationSetName || null,
        emailDomain,
        isCommonDomain,
        nextSteps: [
          "Check the recipient's email inbox (including spam folder)",
          'The recipient should click the verification link in the email',
          'Verification status will be updated in AWS SES console',
          'You can check verification status using AWS SES API',
        ],
        details: {
          emailValidated: validateEmailFormat,
          identityChecked: checkExistingIdentity,
          hasConfigurationSet: !!configurationSetName,
          estimatedDeliveryTime: isCommonDomain
            ? '1-5 minutes'
            : '1-15 minutes',
        },
      };
    } catch (error: any) {
      if (
        error.name === 'CustomVerificationEmailTemplateDoesNotExistException'
      ) {
        throw new Error(
          `Custom verification template "${templateName}" does not exist. Please create the template first or select a different one.`
        );
      }
      if (error.name === 'FromEmailAddressNotVerifiedException') {
        throw new Error(
          'The sender email address in the verification template is not verified. Please verify the sender address in AWS SES console first.'
        );
      }
      if (error.name === 'ProductionAccessNotGrantedException') {
        throw new Error(
          'Your AWS SES account is still in sandbox mode. Request production access in the AWS SES console to verify arbitrary email addresses.'
        );
      }
      if (error.name === 'ConfigurationSetDoesNotExistException') {
        throw new Error(
          `Configuration set "${configurationSetName}" does not exist. Please select a valid configuration set or leave it empty.`
        );
      }

      if (error.name === 'MessageRejected') {
        const errorMessage = getSESErrorMessage(error, configurationSetName);
        throw new Error(errorMessage);
      }

      const errorMessage = getCustomVerificationErrorMessage(
        error,
        templateName
      );
      throw new Error(errorMessage);
    }
  },
});
