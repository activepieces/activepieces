import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { pdfTemplateIdDropdown } from '../common/props';
import { apitemplateIoUpdateTemplateOutputSchema } from '../output-schemas';

export const updateTemplate = createAction({
  auth: ApitemplateAuth,
  name: 'apitemplate_io_update_template',
  outputSchema: apitemplateIoUpdateTemplateOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Template',
  description: 'Updates the HTML body, CSS, or settings of a PDF template.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the HTML body, CSS, and/or print settings of an existing PDF template, identified by its template ID (get one from list-templates). Any field left empty leaves the current value unchanged. This is an experimental vendor endpoint limited to PDF templates and may not be available on every account. Update-to-state, idempotent.',
    idempotent: true,
  },
  props: {
    templateId: pdfTemplateIdDropdown,
    body: Property.LongText({
      displayName: 'HTML Body',
      description: 'New HTML body for the template. Leave empty to keep the current body.',
      required: false,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'New CSS for the template. Leave empty to keep the current CSS.',
      required: false,
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description: 'New print settings for the template. Leave empty to keep the current settings.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { templateId, body, css, settings } = propsValue;

    const requestBody: Record<string, unknown> = { template_id: templateId };

    if (body !== undefined) {
      requestBody['body'] = body;
    }

    if (css !== undefined) {
      requestBody['css'] = css;
    }

    if (settings !== undefined) {
      requestBody['settings'] = settings;
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        '/update-template',
        requestBody,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      return response;
    } catch (error: any) {
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
            `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});
