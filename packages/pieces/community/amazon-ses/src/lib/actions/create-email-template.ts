import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, CreateTemplateCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  createSESClient,
  validateTemplateName,
  validateTemplateContent,
  validateTemplateVariables,
  getTemplateErrorMessage,
  extractTemplateVariables,
  createTemplatePreview,
  getEmailTemplates,
} from '../common/ses-utils';

export const createEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'create_email_template',
  displayName: 'Create Email Template',
  description: 'Create a reusable HTML or text email template with variables',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description:
        'Unique template name (letters, numbers, underscores, hyphens only)',
      required: true,
    }),
    templateFormat: Property.StaticDropdown({
      displayName: 'Template Format',
      description: 'Choose template format',
      required: true,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'text' },
          { label: 'Both HTML and Text', value: 'both' },
        ],
      },
    }),
    subjectPart: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject (use {{variable}} for dynamic content)',
      required: true,
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML Content',
      description: 'HTML email content with variables like {{firstName}}',
      required: false,
    }),
    textPart: Property.LongText({
      displayName: 'Text Content',
      description: 'Plain text email content with variables like {{firstName}}',
      required: false,
    }),
    checkExisting: Property.Checkbox({
      displayName: 'Check if Template Exists',
      description: 'Verify template name is unique before creating',
      required: false,
      defaultValue: true,
    }),
    sampleData: Property.Object({
      displayName: 'Sample Variable Data',
      description: 'Test data for template variables (optional preview)',
      required: false,
    }),
  },
  async run(context) {
    const {
      templateName,
      templateFormat,
      subjectPart,
      htmlPart,
      textPart,
      checkExisting,
      sampleData,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    validateTemplateName(templateName);

    if (templateFormat === 'html' && !htmlPart) {
      throw new Error('HTML content is required when using HTML format');
    }
    if (templateFormat === 'text' && !textPart) {
      throw new Error('Text content is required when using text format');
    }
    if (templateFormat === 'both' && (!htmlPart || !textPart)) {
      throw new Error(
        'Both HTML and text content are required when using both formats'
      );
    }

    validateTemplateContent(htmlPart, textPart);

    const templateVariables = validateTemplateVariables(
      subjectPart,
      htmlPart,
      textPart
    );

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    if (checkExisting) {
      try {
        const existingTemplates = await getEmailTemplates({
          accessKeyId,
          secretAccessKey,
          region,
        });
        if (existingTemplates.includes(templateName)) {
          throw new Error(
            `Template "${templateName}" already exists. Please choose a different name.`
          );
        }
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          throw error;
        }
        console.warn('Could not check existing templates:', error);
      }
    }

    const templateData: any = {
      TemplateName: templateName.trim(),
      SubjectPart: subjectPart,
    };

    if (templateFormat === 'html' || templateFormat === 'both') {
      templateData.HtmlPart = htmlPart;
    }
    if (templateFormat === 'text' || templateFormat === 'both') {
      templateData.TextPart = textPart;
    }

    const createTemplateCommand = new CreateTemplateCommand({
      Template: templateData,
    });

    try {
      await sesClient.send(createTemplateCommand);

      let preview: any = {};
      if (
        sampleData &&
        Object.keys(sampleData as Record<string, string>).length > 0
      ) {
        const sampleDataRecord = sampleData as Record<string, string>;
        preview = {
          subject: createTemplatePreview(subjectPart, sampleDataRecord),
          ...(htmlPart && {
            html: createTemplatePreview(htmlPart, sampleDataRecord),
          }),
          ...(textPart && {
            text: createTemplatePreview(textPart, sampleDataRecord),
          }),
        };
      }

      return {
        success: true,
        templateName: templateName.trim(),
        message: 'Email template created successfully',
        format: templateFormat,
        variables: templateVariables,
        variableCount: templateVariables.length,
        ...(Object.keys(preview).length > 0 && { preview }),
        details: {
          hasHtml: !!htmlPart,
          hasText: !!textPart,
          subjectLength: subjectPart.length,
          htmlLength: htmlPart?.length || 0,
          textLength: textPart?.length || 0,
        },
      };
    } catch (error: any) {
      const errorMessage = getTemplateErrorMessage(error, templateName);
      throw new Error(errorMessage);
    }
  },
});
