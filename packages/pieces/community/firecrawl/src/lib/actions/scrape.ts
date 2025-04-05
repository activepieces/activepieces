import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const scrape = createAction({
  auth: firecrawlAuth,
  name: 'scrape',
  displayName: 'Scrape Website',
  description: 'Scrape a website by performing a series of actions like clicking, typing, taking screenshots, and extracting data.',
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to scrape.',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Maximum time to wait for the page to load (in milliseconds).',
      required: false,
      defaultValue: 60000,
    }),
    useActions: Property.Checkbox({
      displayName: 'Perform Actions Before Scraping',
      description: 'Enable to perform a sequence of actions on the page before scraping (like clicking buttons, filling forms, etc.). See [Firecrawl Actions Documentation](https://docs.firecrawl.dev/api-reference/endpoint/scrape#body-actions) for details on available actions and their parameters.',
      required: false,
      defaultValue: false,
    }),
    actionProperties: Property.DynamicProperties({
      displayName: 'Action Properties',
      description: 'Properties for actions that will be performed on the page.',
      required: false,
      refreshers: ['useActions'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const useActions = propsValue['useActions'] as unknown as boolean;
        
        if (!useActions) {
          return {};
        }
        
        return {
          actions: Property.Json({
            displayName: 'Actions',
            description: 'Sequence of actions to perform on the page.',
            required: false,
            defaultValue: [
              {
                type: 'wait',
                selector: '#example'
              },
              {
                type: 'write',
                selector: '#input',
                text: 'Hello World',
              },
              {
                type: 'click',
                selector: '#button',
              },
              {
                type: 'screenshot',
              },
            ],
          }),
        };
      },
    }),
    extractionType: Property.Dropdown({
      displayName: 'Extraction Type',
      description: 'Choose how to extract data from the webpage.',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Prompt', value: 'prompt' },
            { label: 'JSON Schema', value: 'schema' }
          ]
        };
      },
      defaultValue: 'default',
    }),
    extractProperties: Property.DynamicProperties({
      displayName: 'Extraction Properties',
      description: 'Properties for data extraction from the webpage.',
      required: false,
      refreshers: ['extractionType'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const extractionType = propsValue['extractionType'] as unknown as string;
        
        if (extractionType === 'default') {
          return {};
        }
        
        if (extractionType === 'prompt') {
          return {
            prompt: Property.LongText({
              displayName: 'Extraction Prompt',
              description: 'Describe what information you want to extract in natural language.',
              required: true,
              defaultValue: 'Extract the main product information including name, price, and description.',
            }),
          };
        }
        
        if (extractionType === 'schema') {
          return {
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
              },
            }),
          };
        }
        
        return {};
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      url: propsValue.url,
      timeout: propsValue.timeout,
    };
    
    // Only include actions if the toggle is enabled and actions are provided
    if (propsValue.useActions && propsValue.actionProperties && propsValue.actionProperties['actions']) {
      body['actions'] = propsValue.actionProperties['actions'] || [];
    }
    
    // Add extraction options based on the selected type
    const extractionType = propsValue.extractionType as string;
    
    if (extractionType !== 'default' && propsValue.extractProperties) {
      body['formats'] = ['json'];
      body['jsonOptions'] = {};
      
      if (extractionType === 'prompt' && propsValue.extractProperties['prompt']) {
        body['jsonOptions']['prompt'] = propsValue.extractProperties['prompt'];
      } else if (extractionType === 'schema' && propsValue.extractProperties['schema']) {
        body['jsonOptions']['schema'] = propsValue.extractProperties['schema'];
      }
    }
    
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