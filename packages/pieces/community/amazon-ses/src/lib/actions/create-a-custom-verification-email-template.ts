import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import { CreateCustomVerificationEmailTemplateCommand } from '@aws-sdk/client-sesv2';

export const createACustomVerificationEmailTemplate = createAction({
  auth: amazonSESAuth,
  name: 'create-custom-verification-email-template',
  displayName: 'Create Custom Verification Email Template',
  description: 'Creates a new custom verification email template in Amazon SES for email address verification',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Name of the custom verification email template (must be unique)',
      required: true,
    }),
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'Email address to send verification emails from (must be verified in SES)',
      required: true,
    }),
    templateSubject: Property.ShortText({
      displayName: 'Template Subject',
      description: 'Subject line for the verification email',
      required: true,
    }),
    templateContent: Property.LongText({
      displayName: 'Template Content',
      description: 'HTML content of the verification email. Must include {{verificationLink}} placeholder for the verification link.',
      required: true,
    }),
    successRedirectionURL: Property.ShortText({
      displayName: 'Success Redirection URL',
      description: 'URL to redirect users to after successful email verification',
      required: true,
    }),
    failureRedirectionURL: Property.ShortText({
      displayName: 'Failure Redirection URL',
      description: 'URL to redirect users to if email verification fails',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      templateName,
      fromEmailAddress,
      templateSubject,
      templateContent,
      successRedirectionURL,
      failureRedirectionURL,
    } = propsValue;


    const sesClient = createSES(auth);

    try {
      const command = new CreateCustomVerificationEmailTemplateCommand({
        TemplateName: templateName,
        FromEmailAddress: fromEmailAddress,
        TemplateSubject: templateSubject,
        TemplateContent: templateContent,
        SuccessRedirectionURL: successRedirectionURL,
        FailureRedirectionURL: failureRedirectionURL,
      });

      const result = await sesClient.send(command);

      return {
        success: true,
        templateName,
        fromEmailAddress,
        templateSubject,
        successRedirectionURL,
        failureRedirectionURL,
        timestamp: new Date().toISOString(),
        message: 'Custom verification email template created successfully',
        metadata: {
          requestId: result.$metadata?.requestId,
          httpStatusCode: result.$metadata?.httpStatusCode,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('AlreadyExists') || errorMessage.includes('already exists')) {
        throw new Error(`Template "${templateName}" already exists. Please choose a different template name.`);
      } else if (errorMessage.includes('Email address is not verified')) {
        throw new Error(`Email address "${fromEmailAddress}" is not verified in SES. Please verify the email address in the AWS SES console first.`);
      } else if (errorMessage.includes('Invalid email address')) {
        throw new Error(`Invalid email address format: "${fromEmailAddress}". Please provide a valid email address.`);
      } else if (errorMessage.includes('InvalidParameterValue')) {
        throw new Error('Invalid parameter value provided. Please check all fields and ensure URLs are valid.');
      }
      
      throw new Error(`Failed to create custom verification email template: ${errorMessage}`);
    }
  },
});
