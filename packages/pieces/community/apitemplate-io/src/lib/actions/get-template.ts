import { createAction } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { pdfTemplateIdDropdown } from '../common/props';
import { apitemplateIoGetTemplateOutputSchema } from '../output-schemas';

export const getTemplate = createAction({
  auth: ApitemplateAuth,
  name: 'apitemplate_io_get_template',
  outputSchema: apitemplateIoGetTemplateOutputSchema,
  classification: 'READ',
  displayName: 'Get Template',
  description: 'Retrieves the body, CSS, and settings of a PDF template.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the HTML body, CSS, and print settings of a single PDF template, identified by its template ID (get one from list-templates). This is an experimental vendor endpoint limited to PDF templates and may not be available on every account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    templateId: pdfTemplateIdDropdown,
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { templateId } = propsValue;

    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    const endpoint = `/get-template?${queryParams.toString()}`;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        endpoint,
        undefined,
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
