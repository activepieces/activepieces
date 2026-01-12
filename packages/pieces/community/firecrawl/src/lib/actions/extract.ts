import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, pollingHelper } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';
import { forJsonOutputFormat, polling, FIRECRAWL_API_BASE_URL } from '../common/common';

export const extract = createAction({
  auth: firecrawlAuth,
  name: 'extract',
  displayName: 'Extract Structured Data',
  description: 'Extract structured data from multiple URLs using AI.',
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Add one or more URLs to extract data from.',
      required: true,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Website URL to extract data from',
          required: true,
        })
      }
    }),
    prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'Describe what information you want to extract.',
      required: false,
      defaultValue: 'Extract the following data from the provided content.',
    }),
    enableWebSearch: Property.Checkbox({
      displayName: 'Enable Web Search',
      description: 'Enable web search to find additional context.',
      required: false,
      defaultValue: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'Timeout in seconds after which the task will be cancelled',
      required: false,
      defaultValue: 300,
    }),
    mode: Property.StaticDropdown<'simple' | 'advanced'>({
      displayName: 'Data Schema Type',
      description: 'For complex schema, you can use advanced mode.',
      required: true,
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          { label: 'Simple', value: 'simple' },
          { label: 'Advanced', value: 'advanced' },
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
              description:
                'Learn more about JSON Schema here: https://json-schema.org/learn/getting-started-step-by-step',
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
            displayName: 'Data Definition',
            required: true,
            properties: {
              name: Property.ShortText({
                displayName: 'Name',
                description:
                  'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
                required: true,
              }),
              description: Property.LongText({
                displayName: 'Description',
                description:
                  'Brief description of the data, this hints for the AI on what to look for',
                required: false,
              }),
              type: Property.StaticDropdown({
                displayName: 'Data Type',
                description: 'Type of parameter.',
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
                displayName: 'Fail if Not present?',
                required: true,
                defaultValue: false,
              }),
            },
          }),
        };
      },
    }),
  },

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
    };

    if (propsValue.enableWebSearch) {
      body['enableWebSearch'] = true;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FIRECRAWL_API_BASE_URL}/extract`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
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
