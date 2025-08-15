import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import {
  CreateEmailTemplateCommand,
  EmailTemplateContent,
} from '@aws-sdk/client-sesv2';

export const createEmailTemplate = createAction({
  auth: amazonSESAuth,
  name: 'create-email-template',
  displayName: 'Create Email Template',
  description: 'Create a HTML or a plain text email template in Amazon SES',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Name of the email template (must be unique)',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML Content',
      description:
        'HTML version of the email template. Use {{variable}} for dynamic content.',
      required: false,
    }),
    textPart: Property.LongText({
      displayName: 'Text Content',
      description:
        'Plain text version of the email template. Use {{variable}} for dynamic content.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      templateName,
      subject,
      htmlPart,
      textPart,
    } = propsValue;

    if (!htmlPart && !textPart) {
      throw new Error(
        'Either HTML content or text content must be provided'
      );
    }

    const sesClient = createSES(auth);

    try {
      const templateContent: EmailTemplateContent = {
        Subject: subject,
        ...(htmlPart && { Html: htmlPart }),
        ...(textPart && { Text: textPart }),
      };

      const command = new CreateEmailTemplateCommand({
        TemplateName: templateName,
        TemplateContent: templateContent,
      });

      await sesClient.send(command);

      return {
        success: true,
        templateName,
        templateType: 'regular',
        timestamp: new Date().toISOString(),
        message: 'Email template created successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('AlreadyExists') || errorMessage.includes('already exists')) {
        throw new Error(`Template "${templateName}" already exists. Please choose a different template name.`);
      } else if (errorMessage.includes('InvalidParameterValue')) {
        throw new Error('Invalid parameter value provided. Please check all fields and ensure the template content is valid.');
      }
      
      throw new Error(`Failed to create email template: ${errorMessage}`);
    }
  },
});
