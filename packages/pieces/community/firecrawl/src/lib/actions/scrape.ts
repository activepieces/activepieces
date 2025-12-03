import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';
import { forScreenshotOutputFormat, forSimpleOutputFormat, downloadAndSaveScreenshot, forJsonOutputFormat, FIRECRAWL_API_BASE_URL } from '../common/common';

function forDefaultScreenshot(): any {
  return {
    type: 'screenshot',
    fullPage: true,
  };
}

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
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
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

    formats: Property.Dropdown({
      auth: firecrawlAuth,
      displayName: 'Output Format',
      description: 'Choose what format you want your output in.',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'Summary', value: 'summary' },
            { label: 'HTML', value: 'html' },
            { label: 'Raw HTML', value: 'rawHtml' },
            { label: 'Links', value: 'links' },
            { label: 'Images', value: 'images' },
            { label: 'Screenshot', value: 'screenshot' },
            { label: 'JSON', value: 'json' }
          ]
        };
      },
      defaultValue: 'markdown',
    }),
    extractPrompt: Property.DynamicProperties({
      displayName: 'Extraction Prompt',
      description: 'Prompt for extracting data.',
      required: false,
      refreshers: ['formats'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        const map: InputPropertyMap = {
          prompt: Property.LongText({
            displayName: 'Extraction Prompt',
            description: 'Describe what information you want to extract.',
            required: false,
            defaultValue: 'Extract the following data from the provided text.',
          }),
        };
        return map;
      },
    }),

    extractMode: Property.DynamicProperties({
      displayName: 'Schema Mode',
      description: 'Data schema type.',
      required: false,
      refreshers: ['formats'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        return {
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
        };
      },
    }),
    extractSchema: Property.DynamicProperties({
      displayName: 'Data Definition',
      required: false,
      refreshers: ['formats', 'extractMode'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const mode = (propsValue['extractMode'] as unknown as { mode: 'simple' | 'advanced' })?.mode;
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {}; 
        }

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
  async run(context) {
    const { auth, propsValue } = context;
    const body: Record<string, any> = {
      url: propsValue.url,
      timeout: propsValue.timeout,
    };
    
    if (propsValue.useActions && propsValue.actionProperties && propsValue.actionProperties['actions']) {
      body['actions'] = propsValue.actionProperties['actions'] || [];
    }
    
    const format = propsValue.formats as string;
    const formatsArray: any[] = []; 

    // user selection
    if (format === 'screenshot') {
      const screenshotFormat = forScreenshotOutputFormat();
      formatsArray.push(screenshotFormat);
    } else if (format === 'json') {
      const extractConfig = {
        prompt: propsValue.extractPrompt?.['prompt'],
        mode: propsValue.extractMode?.['mode'],
        schema: propsValue.extractSchema
      };
      const jsonFormat = forJsonOutputFormat(extractConfig);
      formatsArray.push({
        type: 'json',
        prompt: jsonFormat.prompt,
        schema: jsonFormat.schema
      });
    } else {
      const simpleFormat = forSimpleOutputFormat(format);
      formatsArray.push(simpleFormat);
    }

    if (format !== 'screenshot') {
      const defaultScreenshot = forDefaultScreenshot();
      formatsArray.push(defaultScreenshot);
    }
    body['formats'] = formatsArray;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FIRECRAWL_API_BASE_URL}/scrape`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    const result = response.body;
    await downloadAndSaveScreenshot(result.data, context);

    // reorder the data object to put screenshot first, then user's selected format only
    result.data = {
      screenshot: result.data.screenshot,
      [format]: result.data[format],
      metadata: result.data.metadata
    };

    return result;
  },
}); 