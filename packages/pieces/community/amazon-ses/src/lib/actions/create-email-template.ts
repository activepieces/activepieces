import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, CreateTemplateCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';

export const createEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'create_email_template',
  displayName: 'Create Email Template',
  description:
    'Create a HTML or a plain text email template for personalized emails.',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the template (must be unique)',
      required: true
    }),
    subjectPart: Property.ShortText({
      displayName: 'Subject Part',
      description:
        'The subject line of the email template (can include template variables like {{contact.firstName}})',
      required: true
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML Part',
      description:
        'The HTML content of the email template (can include template variables like {{contact.firstName}})',
      required: false
    }),
    textPart: Property.LongText({
      displayName: 'Text Part',
      description:
        'The plain text content of the email template (can include template variables like {{contact.firstName}})',
      required: false
    })
  },
  async run(context) {
    const { templateName, subjectPart, htmlPart, textPart } =
      context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Validate that at least one content type is provided
    if (!htmlPart && !textPart) {
      throw new Error(
        'At least one of HTML Part or Text Part must be provided'
      );
    }

    // Create SES client
    const sesClient = new SESClient({
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      region
    });

    // Create template command following AWS SDK example structure
    const createTemplateCommand = new CreateTemplateCommand({
      Template: {
        TemplateName: templateName,
        SubjectPart: subjectPart,
        ...(htmlPart ? { HtmlPart: htmlPart } : {}),
        ...(textPart ? { TextPart: textPart } : {})
      }
    });

    try {
      const response = await sesClient.send(createTemplateCommand);

      return {
        success: true,
        templateName: templateName,
        message: 'Email template created successfully'
      };
    } catch (caught) {
      console.log('Failed to create template.', caught);
      return caught;
    }
  }
});
