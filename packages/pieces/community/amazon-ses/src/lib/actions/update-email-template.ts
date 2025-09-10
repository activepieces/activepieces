import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, UpdateTemplateCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getEmailTemplates,
  getEmailTemplate,
  createSESClient,
  validateTemplateContent,
  validateTemplateVariables,
  getTemplateErrorMessage,
  extractTemplateVariables,
  createTemplatePreview,
  compareTemplateContent,
} from '../common/ses-utils';

export const updateEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'update_email_template',
  displayName: 'Update Email Template',
  description: 'Modify an existing email template with new content',
  props: {
    templateName: Property.Dropdown({
      displayName: 'Template to Update',
      description: 'Select template to modify',
      required: true,
      refreshers: ['loadCurrentContent'],
      options: async ({ auth }) => {
        const templates = await getEmailTemplates(auth as any);

        if (templates.length === 0) {
          return {
            disabled: false,
            placeholder: 'No templates found. Create a template first.',
            options: [],
          };
        }

        return {
          disabled: false,
          options: templates.map((template) => ({
            label: template,
            value: template,
          })),
        };
      },
    }),
    loadCurrentContent: Property.Checkbox({
      displayName: 'Load Current Content',
      description: 'Pre-fill fields with existing template content',
      required: false,
      defaultValue: true,
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
    preserveUnspecified: Property.Checkbox({
      displayName: 'Preserve Unspecified Content',
      description: 'Keep existing HTML/text content if not provided',
      required: false,
      defaultValue: false,
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
      preserveUnspecified,
      sampleData,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    let currentTemplate = null;
    if (preserveUnspecified) {
      currentTemplate = await getEmailTemplate(
        { accessKeyId, secretAccessKey, region },
        templateName
      );

      if (!currentTemplate) {
        throw new Error(
          `Template "${templateName}" does not exist. Cannot update non-existent template.`
        );
      }
    }

    let finalHtmlPart = htmlPart;
    let finalTextPart = textPart;

    if (preserveUnspecified && currentTemplate) {
      finalHtmlPart = htmlPart || currentTemplate.htmlPart;
      finalTextPart = textPart || currentTemplate.textPart;
    }

    if (templateFormat === 'html' && !finalHtmlPart) {
      throw new Error('HTML content is required when using HTML format');
    }
    if (templateFormat === 'text' && !finalTextPart) {
      throw new Error('Text content is required when using text format');
    }
    if (templateFormat === 'both' && (!finalHtmlPart || !finalTextPart)) {
      throw new Error(
        'Both HTML and text content are required when using both formats'
      );
    }

    validateTemplateContent(finalHtmlPart, finalTextPart);

    const templateVariables = validateTemplateVariables(
      subjectPart,
      finalHtmlPart,
      finalTextPart
    );

    const templateData: any = {
      TemplateName: templateName,
      SubjectPart: subjectPart,
    };

    if (templateFormat === 'html' || templateFormat === 'both') {
      templateData.HtmlPart = finalHtmlPart;
    }
    if (templateFormat === 'text' || templateFormat === 'both') {
      templateData.TextPart = finalTextPart;
    }

    const updateTemplateCommand = new UpdateTemplateCommand({
      Template: templateData,
    });

    try {
      await sesClient.send(updateTemplateCommand);

      let preview: any = {};
      if (
        sampleData &&
        Object.keys(sampleData as Record<string, string>).length > 0
      ) {
        const sampleDataRecord = sampleData as Record<string, string>;
        preview = {
          subject: createTemplatePreview(subjectPart, sampleDataRecord),
          ...(finalHtmlPart && {
            html: createTemplatePreview(finalHtmlPart, sampleDataRecord),
          }),
          ...(finalTextPart && {
            text: createTemplatePreview(finalTextPart, sampleDataRecord),
          }),
        };
      }

      let changes: any = {};
      if (currentTemplate) {
        changes = compareTemplateContent(
          {
            subjectPart: currentTemplate.subjectPart,
            htmlPart: currentTemplate.htmlPart,
            textPart: currentTemplate.textPart,
          },
          {
            subjectPart,
            htmlPart: finalHtmlPart,
            textPart: finalTextPart,
          }
        );
      }

      return {
        success: true,
        templateName,
        message: 'Email template updated successfully',
        format: templateFormat,
        variables: templateVariables,
        variableCount: templateVariables.length,
        ...(Object.keys(preview).length > 0 && { preview }),
        ...(Object.keys(changes).length > 0 && { changes }),
        details: {
          hasHtml: !!finalHtmlPart,
          hasText: !!finalTextPart,
          subjectLength: subjectPart.length,
          htmlLength: finalHtmlPart?.length || 0,
          textLength: finalTextPart?.length || 0,
          preservedContent: preserveUnspecified,
        },
      };
    } catch (error: any) {
      const errorMessage = getTemplateErrorMessage(error, templateName);
      throw new Error(errorMessage);
    }
  },
});
