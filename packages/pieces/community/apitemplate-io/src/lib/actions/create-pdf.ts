import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';
import { createImageOutputSchema } from '../output-schemas';

export const createPdf = createAction({
  auth: ApitemplateAuth,
  name: 'createPdf',
  outputSchema: createImageOutputSchema,
  classification: 'WRITE',
  displayName: 'Create PDF',
  description: 'Creates a PDF from a template with provided data.',
  audience: 'both',
  aiMetadata: { description: 'Renders a new PDF from a saved APITemplate.io template, merging in the supplied JSON `overrides` array to fill template objects. Use when the layout is already designed as a template; for ad-hoc HTML or a webpage use the from-HTML or from-URL actions instead. Requires a template ID. Not idempotent: each call generates and stores a new PDF.', idempotent: false },
  propertyGroups: [
    {
      key: 'template',
      display: 'section',
      label: 'Template',
      icon: 'file',
      props: ['templateId', 'data', 'dataHelp'],
    },
  ],
  props: {
    templateId: templateIdDropdown,
    data: Property.Json({
      displayName: 'Template Data',
      description: 'The values that fill in the template, as JSON.',
      required: true,
    }),
    dataHelp: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'HTML templates take your own fields, for example `{"name": "Jane"}`. Visual-editor templates take an `overrides` list.',
    }),
    expiration: Property.Number({
      displayName: 'Delete After',
      description:
        'Minutes until the file is deleted, up to 10080. Empty or 0 keeps it.',
      required: false,
      defaultValue: 0,
      advanced: true,
    }),
    generationDelay: Property.Number({
      displayName: 'Render Delay',
      description: 'Milliseconds to wait before rendering the PDF.',
      required: false,
      advanced: true,
    }),
    meta: Property.ShortText({
      displayName: 'Your Reference',
      description: 'Your own ID for this file, to find it in List Objects.',
      placeholder: 'invoice-1042',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const {
      templateId,
      data,
      expiration,
      generationDelay,
      meta,
    } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (generationDelay) {
      queryParams.append('generation_delay', generationDelay.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-pdf?${queryParams.toString()}`;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        data,
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
