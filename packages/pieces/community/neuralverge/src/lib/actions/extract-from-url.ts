import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const extractFromUrlAction = createAction({
  auth: neuralvergeAuth,
  name: 'extract_from_url',
  classification: 'READ',
  displayName: 'Extract Data from URL',
  description: 'Load any web page and extract structured data from it with AI. Cost: 5 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Load one web page and extract the data described in the instructions as JSON. Pass a JSON Schema to pin the output shape. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Full URL of the page to extract from, for example https://example.com/about.',
      required: true,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'What to extract, for example: Collect the company name and contact details.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code used to load the page, for example us.',
      required: false,
      defaultValue: "us",
    }),
    extract_schema_json: Property.LongText({
      displayName: 'Output JSON Schema',
      description: 'Optional JSON Schema that pins the shape of the structured result (machine).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-extract',
      requiredKeys: ['settings'],
      body: {
        url: propsValue.url,
        instructions: propsValue.instructions,
        settings: {
          country_code: propsValue.country_code,
          extract_schema_json: neuralvergeClient.toSchemaString(propsValue.extract_schema_json),
        },
      },
    });
  },
});
