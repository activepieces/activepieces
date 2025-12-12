import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';
import { forScreenshotOutputFormat, forSimpleOutputFormat, forJsonOutputFormat, polling, downloadAndSaveCrawlScreenshots, FIRECRAWL_API_BASE_URL } from '../common/common';

function webhookConfig(useWebhook: boolean, webhookProperties: any): any {
  if (!useWebhook || !webhookProperties) {
    return null;
  }

  const webhookUrl = webhookProperties['webhookUrl'];
  if (!webhookUrl) {
    return null;
  }

  const webhook: Record<string, any> = {
    url: webhookUrl,
  };

  if (webhookProperties['webhookHeaders']) {
    webhook['headers'] = webhookProperties['webhookHeaders'];
  }

  if (webhookProperties['webhookMetadata']) {
    webhook['metadata'] = webhookProperties['webhookMetadata'];
  }

  if (webhookProperties['webhookEvents'] && Array.isArray(webhookProperties['webhookEvents']) && webhookProperties['webhookEvents'].length > 0) {
    webhook['events'] = webhookProperties['webhookEvents'];
  }

  return webhook;
}

export const crawl = createAction({
  auth: firecrawlAuth,
  name: 'crawl',
  displayName: 'Crawl',
  description: 'Crawl multiple pages from a website based on specified rules and patterns.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The base URL to start crawling from.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what information you want to extract.',
      required: false,
      defaultValue: 'Get me all of the blog pages on the website, probably localed in /blog'
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pages to crawl. Default limit is 10.',
      required: false,
      defaultValue: 10,
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
            { label: 'Links', value: 'links' },
            { label: 'HTML', value: 'html' },
            { label: 'Screenshot', value: 'screenshot' },
            { label: 'JSON', value: 'json' },
          ]
        };
      },
      defaultValue: 'markdown',
    }),
    onlyMainContent: Property.Checkbox({
      displayName: 'Only Main Content',
      description: 'Only return the main content of the page, excluding headers, navs, footers, etc.',
      required: false,
      defaultValue: false,
    }),
    extractMode: Property.DynamicProperties({
      auth: firecrawlAuth,
      displayName: 'Schema Mode',
      description: 'Data schema type.',
      required: false,
      refreshers: ['formats'],
      props: async (propsValue): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        const map: InputPropertyMap=  {
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
        return map;
      },
    }),
    extractSchema: Property.DynamicProperties({
      auth: firecrawlAuth,
      displayName: 'Data Definition',
      required: false,
      refreshers: ['formats', 'extractMode'],
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
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'Timeout in seconds after which the task will be cancelled',
      required: false,
      defaultValue: 300,
    }),
    useWebhook: Property.Checkbox({
      displayName: 'Deliver Results to Webhook',
      description: 'Enable to send crawl results to a webhook URL.',
      required: false,
      defaultValue: false,
    }),
    webhookProperties: Property.DynamicProperties({
      displayName: 'Webhook Properties',
      description: 'Properties for webhook configuration.',
      required: false,
      refreshers: ['useWebhook'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const useWebhook = propsValue['useWebhook'] as unknown as boolean;
        
        if (!useWebhook) {
          return {};
        }
        
        const map: InputPropertyMap = {
          webhookUrl: Property.ShortText({
            displayName: 'Webhook URL',
            description: 'The URL to send the webhook to. This will trigger for crawl started (crawl.started), every page crawled (crawl.page) and when the crawl is completed (crawl.completed or crawl.failed).',
            required: true,
          }),
          webhookHeaders: Property.Json({
            displayName: 'Webhook Headers',
            description: 'Headers to send to the webhook URL.',
            required: false,
            defaultValue: {},
          }),
          webhookMetadata: Property.Json({
            displayName: 'Webhook Metadata',
            description: 'Custom metadata that will be included in all webhook payloads for this crawl.',
            required: false,
            defaultValue: {},
          }),
          webhookEvents: Property.Array({
            displayName: 'Webhook Events',
            description: 'Type of events that should be sent to the webhook URL. (default: all)',
            required: false,
            defaultValue: ['completed', 'page', 'failed', 'started'],
          }),
        };
        return map;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const body: Record<string, any> = {
      url: propsValue.url,
      sitemap: "include", 
      crawlEntireDomain: false,
      maxDiscoveryDepth: 10,
    };

    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }

    if (propsValue.prompt !== undefined) {
      body['prompt'] = propsValue.prompt
    }

    const scrapeOptions: Record<string, any> = {};
    const format = propsValue.formats as string;

    if (format === 'screenshot') {
      scrapeOptions['formats'] = [forScreenshotOutputFormat()];
    } else if (format === 'json') {
      const extractConfig = {
        mode: propsValue.extractMode?.['mode'],
        schema: propsValue.extractSchema
      };

      const jsonFormat = forJsonOutputFormat(extractConfig);
      scrapeOptions['formats'] = [{
        type: 'json',
        schema: jsonFormat.schema
      }];
    } else {
      scrapeOptions['formats'] = [forSimpleOutputFormat(format)];
    }

    if (propsValue.onlyMainContent !== undefined) {
      scrapeOptions['onlyMainContent'] = propsValue.onlyMainContent;
    }
    scrapeOptions['maxAge'] = 172800000;

    if (Object.keys(scrapeOptions).length > 0) {
      body['scrapeOptions'] = scrapeOptions;
    }

    const webhook = webhookConfig(propsValue.useWebhook || false, propsValue.webhookProperties);
    if (webhook) {
      body['webhook'] = webhook;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FIRECRAWL_API_BASE_URL}/crawl`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    const jobId = response.body.id;

    // polling
    const timeoutSeconds = propsValue.timeout || 300;
    const result = await polling(jobId, auth.secret_text, timeoutSeconds, 'crawl');

    if (propsValue.formats === 'screenshot') {
      await downloadAndSaveCrawlScreenshots(result, context);
    }

    return result;
  },
}); 