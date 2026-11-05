import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../auth';
import { extractOutputSchema } from '../output-schemas';

export const extractAction = createAction({
  name: 'extract',
  outputSchema: extractOutputSchema,
  classification: 'READ',
  displayName: 'Extract Content',
  description: 'Retrieve raw web content from specified URLs.',
  audience: 'both',
  aiMetadata: { description: 'Fetch and return the cleaned, parsed content of one or more specific web pages by passing their URLs, optionally including images found on those pages. Use when you already have exact URLs (e.g. from a prior search) and need their full text rather than performing a new query. Read-only and idempotent: repeating the call with the same URLs has no side effects.', idempotent: true },
  auth: tavilyAuth,
  propertyGroups: [
    { key: 'pages', display: 'section', label: 'Pages', icon: 'file', props: ['urls', 'include_images'] },
  ],
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Pages to read, up to 20 URLs.',
      required: true,
    }),
    include_images: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Add the images found on each page.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.tavily.com/extract',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        urls: propsValue.urls,
        include_images: propsValue.include_images,
      },
    });

    return response.body;
  },
}); 