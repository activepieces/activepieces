import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import { SendCustomVerificationEmailCommand } from '@aws-sdk/client-sesv2';

export const sendACustomVerificationEmail = createAction({
  auth: amazonSESAuth,
  name: 'send-custom-verification-email',
  displayName: 'Send Custom Verification Email',
  description:
    'Sends a custom verification email to add an email address to the list of verified identities in Amazon SES',
  props: {
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description:
        'The email address to verify. This will be added to the list of identities for your AWS account.',
      required: true,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description:
        'The name of the custom verification email template to use for this verification email.',
      required: true,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description:
        'Name of the configuration set to use when sending the verification email (optional).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { emailAddress, templateName, configurationSetName } = propsValue;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      throw new Error(
        `Invalid email address format: "${emailAddress}". Please provide a valid email address.`
      );
    }

    const sesClient = createSES(auth);

    try {
      const sendCustomVerificationEmailParams = {
        EmailAddress: emailAddress,
        TemplateName: templateName,
        ...(configurationSetName && {
          ConfigurationSetName: configurationSetName,
        }),
      };

      const command = new SendCustomVerificationEmailCommand(
        sendCustomVerificationEmailParams
      );
      const result = await sesClient.send(command);

      return {
        success: true,
        emailAddress,
        templateName,
        configurationSetName: configurationSetName || null,
        messageId: result.MessageId,
        timestamp: new Date().toISOString(),
        message: `Custom verification email sent successfully to ${emailAddress}`,
        metadata: {
          requestId: result.$metadata?.requestId,
          httpStatusCode: result.$metadata?.httpStatusCode,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Provide more helpful error messages for common issues
      if (
        errorMessage.includes('Template') &&
        errorMessage.includes('does not exist')
      ) {
        throw new Error(
          `Custom verification email template "${templateName}" does not exist. Please create the template first using the "Create Custom Verification Email Template" action.`
        );
      } else if (errorMessage.includes('MessageRejected')) {
        throw new Error(
          `Message rejected: The email "${emailAddress}" could not receive the verification email. Please check if the email address is valid and can receive emails.`
        );
      } else if (
        errorMessage.includes('ConfigurationSet') &&
        errorMessage.includes('does not exist')
      ) {
        throw new Error(
          `Configuration set "${configurationSetName}" does not exist. Please create the configuration set first or remove this parameter.`
        );
      } else if (errorMessage.includes('SendingQuotaExceeded')) {
        throw new Error(
          'Sending quota exceeded. You have reached your daily sending limit for Amazon SES. Please wait or request a limit increase.'
        );
      } else if (errorMessage.includes('MailFromDomainNotVerified')) {
        throw new Error(
          'The domain used in the template\'s "From" address is not verified. Please verify the domain in the AWS SES console.'
        );
      } else if (errorMessage.includes('AccountSendingPaused')) {
        throw new Error(
          "Your Amazon SES account's ability to send email is currently paused. Please contact AWS support."
        );
      }

      throw new Error(
        `Failed to send custom verification email: ${errorMessage}`
      );
    }
  },
});
