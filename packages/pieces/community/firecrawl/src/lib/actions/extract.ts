import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { forJsonOutputFormat, polling, FIRECRAWL_API_BASE_URL, FIRECRAWL_ORIGIN } from '../common/common';
import { extractDataActionOutputSchema } from '../output-schemas';

export const extract = createAction({
  auth: firecrawlAuth,
  name: 'extract',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Pull structured data from one or more pages with AI.',
  audience: 'human',
  outputSchema: extractDataActionOutputSchema,
  aiMetadata: { description: 'Pulls structured data from one or more known URLs by running an AI extraction against a natural-language prompt and a field schema (simple field list or advanced JSON Schema). Choose this when you need specific typed values from pages you already have URLs for; use Scrape to read raw page content or Map to discover URLs first. Runs as a polled job bounded by the timeout; read-only against the sites, so repeating the same request is safe.', idempotent: true },
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Pages to read. End a URL with /* to cover a whole site.',
      required: true,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          placeholder: 'https://example.com/pricing',
          required: true,
        })
      }
    }),
    enableWebSearch: Property.Checkbox({
      displayName: 'Enable Web Search',
      description: 'Also search the web for related pages and context.',
      required: false,
      defaultValue: false,
    }),
    prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'What to pull from the page, in plain words.',
      required: false,
      defaultValue: 'Extract the following data from the provided content.',
    }),
    mode: Property.StaticDropdown<'simple' | 'advanced'>({
      displayName: 'Data Schema Type',
      required: true,
      defaultValue: 'simple',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Simple', value: 'simple', description: 'A list of fields', icon: 'text' },
          { label: 'Advanced', value: 'advanced', description: 'A JSON Schema', icon: 'code' },
        ],
      },
    }),
    schema: Property.DynamicProperties({
      displayName: 'Data Definition',   
      auth: firecrawlAuth,
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as 'simple' | 'advanced';
        if (mode === 'advanced') {
          return {
            fields: Property.Json({
              displayName: 'JSON Schema',
              description: 'The shape of the data to return, as a JSON Schema.',
              required: true,
              defaultValue: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  age: {
                    type: 'number',
                  },
                },
                required: ['name'],
              },
            }),
          };
        }
        return {
          fields: Property.Array({
            displayName: 'Fields to Extract',
            description: 'One row per value to pull from the page.',
            required: true,
            properties: {
              name: Property.ShortText({
                displayName: 'Name',
                description: 'Letters, numbers, _ . or - only.',
                placeholder: 'price',
                required: true,
              }),
              description: Property.LongText({
                displayName: 'Description',
                description: 'What the value is, as a hint for the AI.',
                required: false,
              }),
              type: Property.StaticDropdown({
                displayName: 'Data Type',
                required: true,
                defaultValue: 'string',
                options: {
                  disabled: false,
                  options: [
                    { label: 'Text', value: 'string' },
                    { label: 'Number', value: 'number' },
                    { label: 'Boolean', value: 'boolean' },
                  ],
                },
              }),
              isRequired: Property.Checkbox({
                displayName: 'Required Field',
                description: 'The AI must return a value for this field.',
                required: true,
                defaultValue: false,
              }),
            },
          }),
        };
      },
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Seconds to wait. The job keeps running after a timeout.',
      required: false,
      defaultValue: 300,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'pages', display: 'section', label: 'Pages', icon: 'file', props: ['urls', 'enableWebSearch'] },
    { key: 'data', display: 'section', label: 'What to extract', icon: 'code', props: ['prompt', 'mode', 'schema'] },
  ],

  async run( context ) {
    const { auth, propsValue } = context;
    const urlObjects = propsValue.urls as Array<{ url: string }>;
    const urlsArray = urlObjects.map(item => item.url);

    const extractConfig = {
      prompt: propsValue.prompt,
      mode: propsValue.mode,
      schema: propsValue.schema
    };

    const jsonFormat = forJsonOutputFormat(extractConfig);

    const body: Record<string, any> = {
      urls: urlsArray,
      prompt: jsonFormat.prompt,
      schema: jsonFormat.schema,
      origin: FIRECRAWL_ORIGIN,
    };

    if (propsValue.enableWebSearch) {
      body['enableWebSearch'] = true;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FIRECRAWL_API_BASE_URL}/extract`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.secret_text}`,
      },
      body: body,
    });

    const jobId = response.body.id;

    // polling
    const timeoutSeconds = propsValue.timeout || 300;
    const result = await polling(jobId, auth.secret_text, timeoutSeconds, 'extract')
    return result;
  },
});
