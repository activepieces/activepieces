import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, SendCustomVerificationEmailCommand } from '@aws-sdk/client-ses';
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
    const sesClient = new SESClient({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Send custom verification email command following AWS SDK pattern
    const sendCustomVerificationEmailCommand = new SendCustomVerificationEmailCommand({
      EmailAddress: emailAddress,
      TemplateName: templateName,
      ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {})
    });

    try {
      const response = await sesClient.send(sendCustomVerificationEmailCommand);

      return {
        success: true,
        messageId: response.MessageId,
        emailAddress: emailAddress,
        templateName: templateName,
        configurationSetName: configurationSetName || 'None',
        message: 'Custom verification email sent successfully',
      };
    } catch (caught) {
      console.log('Failed to send custom verification email.', caught);
      return caught;
    }
  },
});
