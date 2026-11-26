import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';
import { createImageOutputSchema } from '../output-schemas';

export const createImage = createAction({
  auth: ApitemplateAuth,
  name: 'createImage',
  outputSchema: createImageOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Image',
  description: 'Creates an image from a template with provided data.',
  audience: 'both',
  aiMetadata: { description: 'Renders a new image from a saved APITemplate.io template, merging in the supplied JSON `overrides` array to fill template objects. Requires a template ID (pick from the dropdown). Not idempotent: each call generates and stores a new image with its own transaction reference.', idempotent: false },
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
      description: 'The overrides that fill in the template, as JSON.',
      required: true,
    }),
    dataHelp: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'Each override names a template object and the properties to change, for example `{"overrides": [{"name": "text_1", "text": "Hello"}]}`.',
    }),
    generationDelay: Property.Number({
      displayName: 'Render Delay',
      description: 'Milliseconds to wait before rendering the image.',
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
      generationDelay,
      meta,
    } = propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (generationDelay) {
      queryParams.append('generation_delay', generationDelay.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-image?${queryParams.toString()}`;

    const response = await makeRequest(
      authConfig.apiKey,
      HttpMethod.POST,
      endpoint,
      data,
      undefined,
      authConfig.region as ApitemplateRegion
    );

    return response;
  },
});