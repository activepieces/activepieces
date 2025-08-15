import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, CreateEmailTemplateCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const createEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'create_email_template',
  displayName: 'Create Email Template',
  description: 'Create a HTML or a plain text email template for personalized emails.',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the template (must be unique)',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email template (can include template variables like {{name}})',
      required: false,
    }),
    templateType: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'Choose the type of template to create',
      required: true,
      options: {
        options: [
          {
            label: 'HTML Template',
            value: 'html',
          },
          {
            label: 'Text Template',
            value: 'text',
          },
          {
            label: 'Both HTML and Text',
            value: 'both',
          },
        ],
      },
      defaultValue: 'html',
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
      throw new Error('Text content is required when template type is text');
    }
    if (templateType === 'both' && (!htmlContent || !textContent)) {
      throw new Error('Both HTML and text content are required when template type is both');
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
    const templateContent: any = {};

    if (subject) {
      templateContent.Subject = subject;
    }

    if (templateType === 'html' || templateType === 'both') {
      templateContent.Html = htmlContent;
    }

    if (templateType === 'text' || templateType === 'both') {
      templateContent.Text = textContent;
    }

    // Prepare create template command input
    const createTemplateInput = {
      TemplateName: templateName,
      TemplateContent: templateContent,
    };

    try {
      // Create the email template
      const command = new CreateEmailTemplateCommand(createTemplateInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        templateName: templateName,
        message: 'Email template created successfully',
        templateContent: templateContent,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific SES errors
      if (errorMessage.includes('AlreadyExistsException')) {
        throw new Error(`Template with name "${templateName}" already exists. Please choose a different name.`);
      } else if (errorMessage.includes('LimitExceededException')) {
        throw new Error('You have reached the maximum number of email templates allowed.');
      } else if (errorMessage.includes('BadRequestException')) {
        throw new Error(`Invalid template data: ${errorMessage}`);
      } else if (errorMessage.includes('TooManyRequestsException')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(`Failed to create email template: ${errorMessage}`);
    }
  },
});
