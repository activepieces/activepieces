import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, SendCustomVerificationEmailCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const sendCustomVerificationEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_custom_verification_email',
  displayName: 'Send Custom Verification Email',
  description: 'Send a custom verification email to add an email address to your SES identities.',
  props: {
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the custom verification email template to use',
      required: true,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description: 'Name of a configuration set to use when sending the verification email',
      required: false,
    }),
  },
  async run(context) {
    const {
      emailAddress,
      templateName,
      configurationSetName,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      throw new Error('Please provide a valid email address');
    }

    // Create SES client
    const sesClient = new SESv2Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Prepare send custom verification email command input
    const sendVerificationInput: any = {
      EmailAddress: emailAddress,
      TemplateName: templateName,
    };

    // Add optional configuration set
    if (configurationSetName) {
      sendVerificationInput.ConfigurationSetName = configurationSetName;
    }

    try {
      // Send the custom verification email
      const command = new SendCustomVerificationEmailCommand(sendVerificationInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        emailAddress: emailAddress,
        templateName: templateName,
        configurationSetName: configurationSetName || 'None',
        message: 'Custom verification email sent successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific SES errors
      if (errorMessage.includes('NotFoundException')) {
        throw new Error(`Template "${templateName}" not found. Please ensure the custom verification email template exists.`);
      } else if (errorMessage.includes('BadRequestException')) {
        throw new Error(`Invalid request data: ${errorMessage}`);
      } else if (errorMessage.includes('LimitExceededException')) {
        throw new Error('You have reached the limit for verification emails. Please wait before sending more.');
      } else if (errorMessage.includes('MailFromDomainNotVerifiedException')) {
        throw new Error('The sending domain is not verified. Please verify your domain in SES.');
      } else if (errorMessage.includes('MessageRejected')) {
        throw new Error(`Verification email was rejected: ${errorMessage}`);
      } else if (errorMessage.includes('SendingPausedException')) {
        throw new Error('Your account\'s ability to send email is currently paused. Please contact AWS support.');
      } else if (errorMessage.includes('TooManyRequestsException')) {
        throw new Error('Too many requests. Please wait before trying again.');
      }
      
      throw new Error(`Failed to send custom verification email: ${errorMessage}`);
    }
  },
});
