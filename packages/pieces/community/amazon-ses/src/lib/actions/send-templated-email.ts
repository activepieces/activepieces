import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import { SendEmailCommand } from '@aws-sdk/client-sesv2';

export const sendTemplatedEmail = createAction({
  auth: amazonSESAuth,
  name: 'send-templated-email',
  displayName: 'Send Templated Email',
  description: 'Send an email using an Amazon SES template with dynamic data substitution',
  props: {
    fromAddress: Property.ShortText({
      displayName: 'From Address',
      description: 'The email address to send from (must be verified in SES)',
      required: true,
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'List of recipient email addresses',
      required: true,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Name of the SES template to use (must be created in SES first)',
      required: true,
    }),
    templateData: Property.Object({
      displayName: 'Template Data',
      description: 'JSON object containing template variables and their values. Example: {"name": "John", "company": "Acme Corp"}',
      required: false,
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'List of CC email addresses',
      required: false,
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'List of BCC email addresses',
      required: false,
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply To Addresses',
      description: 'List of reply-to email addresses',
      required: false,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description: 'Name of the configuration set to use for this email',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Email Tags',
      description: 'List of tags to associate with this email for tracking purposes',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      fromAddress,
      toAddresses,
      templateName,
      templateData,
      ccAddresses,
      bccAddresses,
      replyToAddresses,
      configurationSetName,
      tags,
    } = propsValue;

    const sesClient = createSES(auth);

    // Prepare the destination
    const destination = {
      ToAddresses: toAddresses as string[],
      ...(ccAddresses && ccAddresses.length > 0 && { 
        CcAddresses: ccAddresses as string[] 
      }),
      ...(bccAddresses && bccAddresses.length > 0 && { 
        BccAddresses: bccAddresses as string[] 
      }),
    };

    // Prepare email tags if provided
    const emailTags = tags && Array.isArray(tags) && tags.length > 0 
      ? (tags as string[]).map((tag, index) => ({
          Name: `Tag${index + 1}`,
          Value: tag,
        }))
      : undefined;

    // Prepare the templated email parameters
    const sendTemplatedEmailParams = {
      FromEmailAddress: fromAddress,
      Destination: destination,
      Content: {
        Template: {
          TemplateName: templateName,
          TemplateData: templateData ? JSON.stringify(templateData) : '{}',
        },
      },
      ...(replyToAddresses && replyToAddresses.length > 0 && { 
        ReplyToAddresses: replyToAddresses as string[] 
      }),
      ...(configurationSetName && { ConfigurationSetName: configurationSetName }),
      ...(emailTags && { Tags: emailTags }),
    };

    try {
      const command = new SendEmailCommand(sendTemplatedEmailParams);
      const result = await sesClient.send(command);

      return {
        messageId: result.MessageId,
        success: true,
        timestamp: new Date().toISOString(),
        fromAddress,
        toAddresses,
        templateName,
        templateData: templateData || {},
        tags: tags || [],
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('Template') && errorMessage.includes('does not exist')) {
        throw new Error(`Template "${templateName}" does not exist in SES. Please create the template first using the "Create Email Template" action.`);
      } else if (errorMessage.includes('Email address is not verified')) {
        throw new Error(`Email address is not verified in SES. Please verify the email address "${fromAddress}" in the AWS SES console first.`);
      } else if (errorMessage.includes('Invalid template data')) {
        throw new Error(`Invalid template data provided. Make sure the template data matches the placeholders in your template. Template data: ${JSON.stringify(templateData)}`);
      }
      
      throw new Error(`Failed to send templated email: ${errorMessage}`);
    }
  },
});
