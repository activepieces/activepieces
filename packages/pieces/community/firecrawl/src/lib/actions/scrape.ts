import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const scrape = createAction({
  auth: firecrawlAuth,
  name: 'scrape',
  displayName: 'Scrape Website',
  description: 'Scrape a website by performing a series of actions like clicking, typing, and taking screenshots.',
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
      displayName: 'Use Actions',
      description: 'Enable to perform a sequence of actions on the page before scraping. See [Firecrawl Actions Documentation](https://docs.firecrawl.dev/api-reference/endpoint/scrape#body-actions) for details on available actions and their parameters.',
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