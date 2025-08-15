import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, UpdateCustomVerificationEmailTemplateCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const updateCustomVerificationEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'update_custom_verification_email_template',
  displayName: 'Update Custom Verification Email Template',
  description: 'Update an existing custom verification email template in Amazon SES.',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the custom verification email template to update',
      required: true,
    }),
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'The email address that the custom verification email is sent from. Must be verified in SES.',
      required: true,
    }),
    templateSubject: Property.ShortText({
      displayName: 'Template Subject',
      description: 'The subject line of the custom verification email',
      required: true,
    }),
    templateContent: Property.LongText({
      displayName: 'Template Content',
      description: 'The content of the custom verification email. May contain HTML with some limitations. Total size must be less than 10 MB.',
      required: true,
    }),
    successRedirectionURL: Property.ShortText({
      displayName: 'Success Redirection URL',
      description: 'The URL that the recipient is sent to if their address is successfully verified',
      required: true,
    }),
    failureRedirectionURL: Property.ShortText({
      displayName: 'Failure Redirection URL',
      description: 'The URL that the recipient is sent to if their address is not successfully verified',
      required: true,
    }),
  },
  async run(context) {
    const {
      templateName,
      fromEmailAddress,
      templateSubject,
      templateContent,
      successRedirectionURL,
      failureRedirectionURL,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Validate URLs
    try {
      new URL(successRedirectionURL);
      new URL(failureRedirectionURL);
    } catch (error) {
      throw new Error('Success and failure redirection URLs must be valid URLs');
    }

    // Validate content size (10 MB limit)
    const contentSizeBytes = new TextEncoder().encode(templateContent).length;
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (contentSizeBytes > maxSizeBytes) {
      throw new Error(`Template content size (${Math.round(contentSizeBytes / 1024 / 1024)}MB) exceeds the 10MB limit`);
    }

    // Create SES client
    const sesClient = new SESv2Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Prepare update custom verification email template command input
    const updateTemplateInput = {
      TemplateName: templateName,
      FromEmailAddress: fromEmailAddress,
      TemplateSubject: templateSubject,
      TemplateContent: templateContent,
      SuccessRedirectionURL: successRedirectionURL,
      FailureRedirectionURL: failureRedirectionURL,
    };

    try {
      // Update the custom verification email template
      const command = new UpdateCustomVerificationEmailTemplateCommand(updateTemplateInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        templateName: templateName,
        fromEmailAddress: fromEmailAddress,
        templateSubject: templateSubject,
        successRedirectionURL: successRedirectionURL,
        failureRedirectionURL: failureRedirectionURL,
        contentSize: `${Math.round(contentSizeBytes / 1024)}KB`,
        message: 'Custom verification email template updated successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific SES errors
      if (errorMessage.includes('NotFoundException')) {
        throw new Error(`Custom verification email template "${templateName}" not found. Please ensure the template exists before updating.`);
      } else if (errorMessage.includes('BadRequestException')) {
        throw new Error(`Invalid template data: ${errorMessage}`);
      } else if (errorMessage.includes('TooManyRequestsException')) {
        throw new Error('Too many requests. Please wait before trying again.');
      }
      
      throw new Error(`Failed to update custom verification email template: ${errorMessage}`);
    }
  },
});
