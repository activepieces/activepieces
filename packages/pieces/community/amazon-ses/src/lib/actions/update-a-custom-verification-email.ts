import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import { UpdateCustomVerificationEmailTemplateCommand } from '@aws-sdk/client-sesv2';

export const updateACustomVerificationEmail = createAction({
  auth: amazonSESAuth,
  name: 'update-custom-verification-email-template',
  displayName: 'Update Custom Verification Email Template',
  description: 'Updates an existing custom verification email template in Amazon SES',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Name of the existing custom verification email template to update',
      required: true,
    }),
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'Updated email address to send verification emails from (must be verified in SES)',
      required: true,
    }),
    templateSubject: Property.ShortText({
      displayName: 'Template Subject',
      description: 'Updated subject line for the verification email',
      required: true,
    }),
    templateContent: Property.LongText({
      displayName: 'Template Content',
      description: 'Updated HTML content of the verification email. Must include {{verificationLink}} placeholder for the verification link.',
      required: true,
    }),
    successRedirectionURL: Property.ShortText({
      displayName: 'Success Redirection URL',
      description: 'Updated URL to redirect users to after successful email verification',
      required: true,
    }),
    failureRedirectionURL: Property.ShortText({
      displayName: 'Failure Redirection URL',
      description: 'Updated URL to redirect users to if email verification fails',
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
      const command = new UpdateCustomVerificationEmailTemplateCommand({
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
        message: 'Custom verification email template updated successfully',
        updatedFields: {
          fromEmailAddress,
          templateSubject,
          templateContent: 'Updated',
          successRedirectionURL,
          failureRedirectionURL,
        },
        metadata: {
          requestId: result.$metadata?.requestId,
          httpStatusCode: result.$metadata?.httpStatusCode,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('Template') && errorMessage.includes('does not exist')) {
        throw new Error(`Custom verification email template "${templateName}" does not exist. Please create the template first using the "Create Custom Verification Email Template" action.`);
      } else if (errorMessage.includes('Email address is not verified')) {
        throw new Error(`Email address "${fromEmailAddress}" is not verified in SES. Please verify the email address in the AWS SES console first.`);
      } else if (errorMessage.includes('Invalid email address')) {
        throw new Error(`Invalid email address format: "${fromEmailAddress}". Please provide a valid email address.`);
      } else if (errorMessage.includes('InvalidParameterValue')) {
        throw new Error('Invalid parameter value provided. Please check all fields and ensure URLs are valid and template content includes {{verificationLink}}.');
      }
      
      throw new Error(`Failed to update custom verification email template: ${errorMessage}`);
    }
  },
});
