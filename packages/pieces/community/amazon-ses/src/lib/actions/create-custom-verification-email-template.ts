import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SESClient,
  CreateCustomVerificationEmailTemplateCommand,
} from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getVerifiedIdentities,
  getCustomVerificationTemplates,
  createSESClient,
  validateCustomVerificationTemplateName,
  validateURL,
  validateCustomVerificationContent,
  getCustomVerificationErrorMessage,
  formatContentSize,
  createIdentityDropdownOptions,
  isValidEmail,
} from '../common/ses-utils';

export const createCustomVerificationEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'create_custom_verification_email_template',
  displayName: 'Create Custom Verification Email Template',
  description: 'Create custom email template for identity verification',
  props: {
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description:
        'Unique template name (letters, numbers, underscores, hyphens only)',
      required: true,
    }),
    fromEmailAddress: Property.Dropdown({
      displayName: 'From Email',
      description: 'Verified sender email address',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const verifiedIdentities = await getVerifiedIdentities(auth as any);
        return createIdentityDropdownOptions(verifiedIdentities);
      },
    }),
    templateSubject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject for verification messages',
      required: true,
    }),
    templateContent: Property.LongText({
      displayName: 'Email Content',
      description:
        'HTML content for verification email (must include verification link)',
      required: true,
    }),
    successRedirectionURL: Property.ShortText({
      displayName: 'Success Redirect URL',
      description: 'URL to redirect users after successful verification',
      required: true,
    }),
    failureRedirectionURL: Property.ShortText({
      displayName: 'Failure Redirect URL',
      description: 'URL to redirect users if verification fails',
      required: true,
    }),
    checkExisting: Property.Checkbox({
      displayName: 'Check if Template Exists',
      description: 'Verify template name is unique before creating',
      required: false,
      defaultValue: true,
    }),
    validateUrls: Property.Checkbox({
      displayName: 'Validate URLs',
      description: 'Check that redirect URLs are properly formatted',
      required: false,
      defaultValue: true,
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
      checkExisting,
      validateUrls,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    validateCustomVerificationTemplateName(templateName);

    if (!isValidEmail(fromEmailAddress)) {
      throw new Error(`Invalid sender email address: ${fromEmailAddress}`);
    }

    if (validateUrls) {
      validateURL(successRedirectionURL, 'Success redirect URL');
      validateURL(failureRedirectionURL, 'Failure redirect URL');
    }

    validateCustomVerificationContent(templateContent);

    const contentSize = formatContentSize(templateContent);

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    if (checkExisting) {
      try {
        const existingTemplates = await getCustomVerificationTemplates({
          accessKeyId,
          secretAccessKey,
          region,
        });
        if (existingTemplates.includes(templateName)) {
          throw new Error(
            `Custom verification template "${templateName}" already exists. Please choose a different name.`
          );
        }
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          throw error;
        }
        console.warn('Could not check existing templates:', error);
      }
    }

    const contentLower = templateContent.toLowerCase();
    const hasLink =
      contentLower.includes('href') || contentLower.includes('link');
    const hasVerificationText =
      contentLower.includes('verify') ||
      contentLower.includes('confirm') ||
      contentLower.includes('activate');

    if (!hasLink) {
      console.warn(
        'Template content may be missing verification link - ensure you include proper verification URL in your template'
      );
    }

    if (!hasVerificationText) {
      console.warn(
        'Template content may be missing verification instructions - consider adding clear verification language'
      );
    }

    const createCommand = new CreateCustomVerificationEmailTemplateCommand({
      TemplateName: templateName.trim(),
      FromEmailAddress: fromEmailAddress,
      TemplateSubject: templateSubject,
      TemplateContent: templateContent,
      SuccessRedirectionURL: successRedirectionURL.trim(),
      FailureRedirectionURL: failureRedirectionURL.trim(),
    });

    try {
      await sesClient.send(createCommand);

      return {
        success: true,
        templateName: templateName.trim(),
        message: 'Custom verification email template created successfully',
        fromEmailAddress,
        templateSubject,
        successRedirectionURL: successRedirectionURL.trim(),
        failureRedirectionURL: failureRedirectionURL.trim(),
        contentSize: contentSize.formatted,
        details: {
          contentSizeBytes: contentSize.bytes,
          subjectLength: templateSubject.length,
          contentLength: templateContent.length,
          hasVerificationLanguage: hasVerificationText,
          hasLinks: hasLink,
        },
        recommendations: [
          ...(hasLink
            ? []
            : ['Consider adding verification link in template content']),
          ...(hasVerificationText
            ? []
            : ['Consider adding clear verification instructions']),
          'Test the template with a sample email address',
          'Ensure redirect URLs are accessible and provide good user experience',
        ],
      };
    } catch (error: any) {
      const errorMessage = getCustomVerificationErrorMessage(
        error,
        templateName
      );
      throw new Error(errorMessage);
    }
  },
});
