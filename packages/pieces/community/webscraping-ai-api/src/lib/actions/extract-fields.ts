import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const extractFields = createAction({
  name: 'extract_fields',
  displayName: 'Extract Structured Data',
  description:
    'Returns structured data fields extracted from the webpage using an LLM model',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL of the target page',
      required: true
    }),
    fields: Property.Object({
      displayName: 'Fields to Extract',
      description:
        'Object describing fields to extract from the page and their descriptions (e.g., {"title": "Main product title", "price": "Current product price"})',
      required: true
    }),
    headers: Property.Object({
      displayName: 'HTTP Headers',
      description: 'HTTP headers to pass to the target page',
      required: false
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description:
        'Maximum web page retrieval time in ms (10000 by default, maximum is 30000)',
      required: false,
      defaultValue: 10000
    }),
    js: Property.Checkbox({
      displayName: 'Execute JavaScript',
      description: 'Execute on-page JavaScript using a headless browser',
      required: false,
      defaultValue: true
    }),
    js_timeout: Property.Number({
      displayName: 'JavaScript Timeout (ms)',
      description:
        'Maximum JavaScript rendering time in ms (2000 by default, maximum is 20000)',
      required: false,
      defaultValue: 2000
    }),
    wait_for: Property.ShortText({
      displayName: 'Wait For CSS Selector',
      description:
        'CSS selector to wait for before returning the page content. Useful for pages with dynamic content loading',
      required: false
    }),
    proxy: Property.StaticDropdown({
      displayName: 'Proxy Type',
      description: 'Type of proxy to use',
      required: false,
      defaultValue: 'datacenter',
      options: {
        options: [
          { label: 'Datacenter', value: 'datacenter' },
          { label: 'Residential', value: 'residential' }
        ]
      }
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      description: 'Country of the proxy to use',
      required: false,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'United States', value: 'us' },
          { label: 'United Kingdom', value: 'gb' },
          { label: 'Germany', value: 'de' },
          { label: 'Italy', value: 'it' },
          { label: 'France', value: 'fr' },
          { label: 'Canada', value: 'ca' },
          { label: 'Spain', value: 'es' },
          { label: 'Russia', value: 'ru' },
          { label: 'Japan', value: 'jp' },
          { label: 'South Korea', value: 'kr' },
          { label: 'India', value: 'in' }
        ]
      }
    }),
    custom_proxy: Property.ShortText({
      displayName: 'Custom Proxy',
      description:
        'Your own proxy URL in "http://user:password@host:port" format',
      required: false
    }),
    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Type of device emulation',
      required: false,
      defaultValue: 'desktop',
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' }
        ]
      }
    }),
    error_on_404: Property.Checkbox({
      displayName: 'Error on 404',
      description: 'Return error on 404 HTTP status on the target page',
      required: false,
      defaultValue: false
    }),
    error_on_redirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description: 'Return error on redirect on the target page',
      required: false,
      defaultValue: false
    }),
    js_script: Property.LongText({
      displayName: 'Custom JavaScript',
      description: 'Custom JavaScript code to execute on the target page',
      required: false
    })
  },
  async run(context) {
    const { url, fields, ...otherProps } = context.propsValue;
    const apiKey = context.auth as string;

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Build query parameters
    const queryParams: Record<string, string> = {
      url,
      api_key: apiKey
    };

    // Add fields parameter as JSON string
    if (fields) {
      queryParams['fields'] = JSON.stringify(fields);
    }

    // Add optional parameters if they have values
    Object.entries(otherProps).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && key === 'headers') {
          queryParams[key] = JSON.stringify(value);
        } else {
          queryParams[key] = String(value);
        }
      }
    });

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.webscraping.ai/ai/fields',
        queryParams
      });

      return response.body;
    } catch (error) {
      throw new Error(`WebScraping.AI API request failed: ${error}`);
    }
  }
});
