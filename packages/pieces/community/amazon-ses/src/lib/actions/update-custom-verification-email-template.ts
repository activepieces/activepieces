import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SESClient,
  UpdateCustomVerificationEmailTemplateCommand,
} from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';
import {
  getVerifiedIdentities,
  getCustomVerificationTemplates,
  getCustomVerificationTemplate,
  createSESClient,
  validateCustomVerificationTemplateName,
  validateURL,
  validateCustomVerificationContent,
  getCustomVerificationErrorMessage,
  formatContentSize,
  compareCustomVerificationContent,
  createIdentityDropdownOptions,
  isValidEmail,
} from '../common/ses-utils';

export const updateCustomVerificationEmailTemplate = createAction({
  auth: amazonSesAuth,
  name: 'update_custom_verification_email_template',
  displayName: 'Update Custom Verification Email Template',
  description: 'Modify an existing custom verification email template',
  props: {
    templateName: Property.Dropdown({
      displayName: 'Template to Update',
      description: 'Select custom verification template to modify',
      required: true,
      refreshers: ['loadCurrentContent'],
      options: async ({ auth }) => {
        const templates = await getCustomVerificationTemplates(auth as any);

        if (templates.length === 0) {
          return {
            disabled: false,
            placeholder:
              'No custom verification templates found. Create one first.',
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
    preserveUnspecified: Property.Checkbox({
      displayName: 'Preserve Unspecified Fields',
      description: 'Keep existing values if fields are empty',
      required: false,
      defaultValue: false,
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
      preserveUnspecified,
      validateUrls,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    validateCustomVerificationTemplateName(templateName);

    const sesClient = createSESClient({ accessKeyId, secretAccessKey, region });

    let currentTemplate = null;
    if (preserveUnspecified) {
      currentTemplate = await getCustomVerificationTemplate(
        { accessKeyId, secretAccessKey, region },
        templateName
      );

      if (!currentTemplate) {
        throw new Error(
          `Custom verification template "${templateName}" does not exist. Cannot update non-existent template.`
        );
      }
    }

    const finalFromEmail =
      fromEmailAddress || currentTemplate?.fromEmailAddress;
    const finalSubject = templateSubject || currentTemplate?.templateSubject;
    const finalContent = templateContent || currentTemplate?.templateContent;
    const finalSuccessUrl =
      successRedirectionURL || currentTemplate?.successRedirectionURL;
    const finalFailureUrl =
      failureRedirectionURL || currentTemplate?.failureRedirectionURL;

    if (!finalFromEmail) {
      throw new Error('From email address is required');
    }
    if (!finalSubject) {
      throw new Error('Subject is required');
    }
    if (!finalContent) {
      throw new Error('Template content is required');
    }
    if (!finalSuccessUrl) {
      throw new Error('Success redirect URL is required');
    }
    if (!finalFailureUrl) {
      throw new Error('Failure redirect URL is required');
    }

    if (!isValidEmail(finalFromEmail)) {
      throw new Error(`Invalid sender email address: ${finalFromEmail}`);
    }

    if (validateUrls) {
      validateURL(finalSuccessUrl, 'Success redirect URL');
      validateURL(finalFailureUrl, 'Failure redirect URL');
    }

    validateCustomVerificationContent(finalContent);

    const contentSize = formatContentSize(finalContent);

    const contentLower = finalContent.toLowerCase();
    const hasLink =
      contentLower.includes('href') || contentLower.includes('link');
    const hasVerificationText =
      contentLower.includes('verify') ||
      contentLower.includes('confirm') ||
      contentLower.includes('activate');

    const updateCommand = new UpdateCustomVerificationEmailTemplateCommand({
      TemplateName: templateName,
      FromEmailAddress: finalFromEmail,
      TemplateSubject: finalSubject,
      TemplateContent: finalContent,
      SuccessRedirectionURL: finalSuccessUrl.trim(),
      FailureRedirectionURL: finalFailureUrl.trim(),
    });

    try {
      await sesClient.send(updateCommand);

      let changes: any = {};
      if (currentTemplate) {
        changes = compareCustomVerificationContent(
          {
            fromEmailAddress: currentTemplate.fromEmailAddress,
            templateSubject: currentTemplate.templateSubject,
            templateContent: currentTemplate.templateContent,
            successRedirectionURL: currentTemplate.successRedirectionURL,
            failureRedirectionURL: currentTemplate.failureRedirectionURL,
          },
          {
            fromEmailAddress: finalFromEmail,
            templateSubject: finalSubject,
            templateContent: finalContent,
            successRedirectionURL: finalSuccessUrl,
            failureRedirectionURL: finalFailureUrl,
          }
        );
      }

      return {
        success: true,
        templateName,
        message: 'Custom verification email template updated successfully',
        fromEmailAddress: finalFromEmail,
        templateSubject: finalSubject,
        successRedirectionURL: finalSuccessUrl.trim(),
        failureRedirectionURL: finalFailureUrl.trim(),
        contentSize: contentSize.formatted,
        ...(Object.keys(changes).length > 0 && { changes }),
        details: {
          contentSizeBytes: contentSize.bytes,
          subjectLength: finalSubject.length,
          contentLength: finalContent.length,
          hasVerificationLanguage: hasVerificationText,
          hasLinks: hasLink,
          preservedContent: preserveUnspecified,
        },
        recommendations: [
          ...(hasLink
            ? []
            : ['Consider adding verification link in template content']),
          ...(hasVerificationText
            ? []
            : ['Consider adding clear verification instructions']),
          'Test the updated template with a sample email address',
          'Ensure redirect URLs are accessible and provide good user experience',
          'Verify that the sender email address is still verified in SES',
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
