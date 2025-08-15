import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, UpdateEmailTemplateCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const updateEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'update_email_template',
  displayName: 'Update Email Template',
  description: 'Update an existing email template in Amazon SES.',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the template to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email template (can include template variables like {{name}})',
      required: true,
    }),
    templateType: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'The type of email template content to update',
      required: true,
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Text', value: 'text' },
          { label: 'Both HTML and Text', value: 'both' },
        ],
      },
    }),
    htmlContent: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content of the email template (can include template variables like {{name}})',
      required: false,
    }),
    textContent: Property.LongText({
      displayName: 'Text Content',
      description: 'The plain text content of the email template (can include template variables like {{name}})',
      required: false,
    }),
  },
  async run(context) {
    const {
      templateName,
      subject,
      templateType,
      htmlContent,
      textContent,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Validate content based on template type
    if (templateType === 'html' && !htmlContent) {
      throw new Error('HTML content is required when template type is HTML');
    }
    if (templateType === 'text' && !textContent) {
      throw new Error('Text content is required when template type is Text');
    }
    if (templateType === 'both' && (!htmlContent || !textContent)) {
      throw new Error('Both HTML and text content are required when template type is Both HTML and Text');
    }

    // Create SES client
    const sesClient = new SESv2Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Prepare template content
    const templateContent: any = {
      Subject: subject,
    };

    if (templateType === 'html' || templateType === 'both') {
      templateContent.Html = htmlContent;
    }

    if (templateType === 'text' || templateType === 'both') {
      templateContent.Text = textContent;
    }

    // Prepare update template command input
    const updateTemplateInput = {
      TemplateName: templateName,
      TemplateContent: templateContent,
    };

    try {
      // Update the email template
      const command = new UpdateEmailTemplateCommand(updateTemplateInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        templateName: templateName,
        templateContent: templateContent,
        message: 'Email template updated successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific SES errors
      if (errorMessage.includes('NotFoundException')) {
        throw new Error(`Template "${templateName}" not found. Please ensure the template exists before updating.`);
      } else if (errorMessage.includes('BadRequestException')) {
        throw new Error(`Invalid template data: ${errorMessage}`);
      } else if (errorMessage.includes('TooManyRequestsException')) {
        throw new Error('Too many requests. Please wait before trying again.');
      }
      
      throw new Error(`Failed to update email template: ${errorMessage}`);
    }
  },
});
