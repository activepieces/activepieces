import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const extractWithSchema = createAction({
  auth: firecrawlAuth,
  name: 'extractWithSchema',
  displayName: 'Extract with Schema',
  description: 'Extract structured data from any URL using a predefined JSON schema.',
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to extract data from.',
      required: true,
    }),
    schema: Property.Json({
      displayName: 'Extraction Schema',
      description: 'JSON schema defining the structure of data to extract.',
      required: true,
      defaultValue: {
        "type": "object",
        "properties": {
          "company_name": {"type": "string"},
          "pricing_tiers": {"type": "array", "items": {"type": "string"}},
          "has_free_tier": {"type": "boolean"}
        }
      }
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      url: propsValue.url,
      formats: ['json'],
      jsonOptions: {
        schema: propsValue.schema
      }
    };
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.firecrawl.dev/v1/scrape',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    return response.body;
  },
});