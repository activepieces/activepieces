import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSESAuth } from '../../index';
import { createSES } from '../common/client';
import {
  UpdateEmailTemplateCommand,
  EmailTemplateContent,
} from '@aws-sdk/client-sesv2';

export const updateEmailTemplate = createAction({
  auth: amazonSESAuth,
  name: 'update-email-template',
  displayName: 'Update Email Template',
  description: 'Update an existing regular email template in Amazon SES',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Name of the existing email template to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Updated email subject line',
      required: false,
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML Content',
      description:
        'Updated HTML version of the email template. Use {{variable}} for dynamic content.',
      required: false,
    }),
    textPart: Property.LongText({
      displayName: 'Text Content',
      description:
        'Updated plain text version of the email template. Use {{variable}} for dynamic content.',
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

    // At least one content field should be provided
    if (!subject && !htmlPart && !textPart) {
      throw new Error(
        'At least one field (subject, HTML content, or text content) must be provided to update the template'
      );
    }

    const sesClient = createSES(auth);

    try {
      const templateContent: EmailTemplateContent = {};

      // Only include fields that are provided
      if (subject !== undefined && subject !== '') {
        templateContent.Subject = subject;
      }
      if (htmlPart !== undefined && htmlPart !== '') {
        templateContent.Html = htmlPart;
      }
      if (textPart !== undefined && textPart !== '') {
        templateContent.Text = textPart;
      }

      const command = new UpdateEmailTemplateCommand({
        TemplateName: templateName,
        TemplateContent: templateContent,
      });

      await sesClient.send(command);

      return {
        success: true,
        templateName,
        templateType: 'regular',
        timestamp: new Date().toISOString(),
        message: 'Email template updated successfully',
        updatedFields: {
          ...(subject && { subject }),
          ...(htmlPart && { htmlContent: 'Updated' }),
          ...(textPart && { textContent: 'Updated' }),
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('Template') && errorMessage.includes('does not exist')) {
        throw new Error(`Template "${templateName}" does not exist in SES. Please create the template first using the "Create Email Template" action.`);
      } else if (errorMessage.includes('InvalidParameterValue')) {
        throw new Error('Invalid parameter value provided. Please check all fields and ensure the template content is valid.');
      }
      
      throw new Error(`Failed to update email template: ${errorMessage}`);
    }
  },
});
