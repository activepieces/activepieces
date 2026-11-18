import { createAction, Property, InputPropertyMap, tryCatch, MarkdownVariant } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { forScreenshotOutputFormat, forSimpleOutputFormat, forJsonOutputFormat, polling, followCrawlPages, saveFirecrawlFile, FIRECRAWL_API_BASE_URL, FIRECRAWL_ORIGIN } from '../common/common';
import { crawlActionOutputSchema } from '../output-schemas';

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
  classification: 'SEARCH',
  displayName: 'Crawl',
  description: 'Read many pages of a site by following links from a start URL.',
  audience: 'human',
  outputSchema: crawlActionOutputSchema,
  aiMetadata: { description: 'Starts from a base URL, discovers and follows links across the site, and returns the content of many pages in a chosen format (markdown, HTML, links, summary, screenshot, or AI-extracted JSON). Choose this to gather content from a whole site or section; use Scrape for a single page or Map to only list URLs without fetching content. Bounded by the page limit and timeout, and can deliver results to a webhook. Read-only against the site, so re-running the same call is safe.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'Start URL',
      description: 'The crawl follows links from this page.',
      placeholder: 'https://example.com/blog',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Pages to Crawl',
      description: 'Which pages to read, in plain words. Empty: pages under the start URL.',
      required: false,
      defaultValue: 'Get me all of the blog pages on the website, probably located in /blog'
    }),
    limit: Property.Number({
      displayName: 'Max Pages',
      description: "Most pages to read. Empty: Firecrawl's limit of 10,000.",
      required: false,
      defaultValue: 10,
      width: 'half',
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Seconds to wait. The crawl keeps running after a timeout.',
      required: false,
      defaultValue: 300,
      width: 'half',
    }),
    cache_note: Property.MarkDown({
      value: "Pages read in the last 2 days may come from Firecrawl's cache.",
      variant: MarkdownVariant.INFO,
    }),
    formats: Property.Dropdown({
      auth: firecrawlAuth,
      displayName: 'Output Format',
      description: 'What the step returns for each page.',
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
      description: 'Skip headers, menus and footers.',
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
    useWebhook: Property.Checkbox({
      displayName: 'Send Results to a Webhook',
      description: 'Firecrawl posts each event to your URL as the crawl runs.',
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
            description: 'Gets an event when the crawl starts, per page, and when it ends.',
            placeholder: 'https://example.com/webhook',
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
            description: 'Extra data added to every event for this crawl.',
            required: false,
            defaultValue: {},
          }),
          webhookEvents: Property.Array({
            displayName: 'Webhook Events',
            description: 'Events to send: started, page, completed, failed.',
            required: false,
            defaultValue: ['completed', 'page', 'failed', 'started'],
          }),
        };
        return map;
      },
    }),
  },
  propertyGroups: [
    { key: 'site', display: 'section', label: 'Site', icon: 'file', props: ['url', 'prompt'] },
    { key: 'limits', display: 'section', label: 'Limits', icon: 'sliders', props: ['limit', 'timeout'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'code', props: ['cache_note', 'formats', 'onlyMainContent', 'extractMode', 'extractSchema'] },
    { key: 'webhook', display: 'section', label: 'Webhook', icon: 'send', props: ['useWebhook', 'webhookProperties'] },
  ],
  async run(context) {
    const { auth, propsValue } = context;
    const body: Record<string, any> = {
      url: propsValue.url,
      sitemap: "include",
      crawlEntireDomain: false,
      maxDiscoveryDepth: 10,
      origin: FIRECRAWL_ORIGIN,
    };

    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }

    if (typeof propsValue.prompt === 'string' && propsValue.prompt.trim() !== '') {
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
        'Authorization': `Bearer ${auth.secret_text}`,
      },
      body: body,
    });

    const jobId = response.body.id;

    const timeoutSeconds = propsValue.timeout || 300;
    const result = await followCrawlPages({
      firstPage: await polling(jobId, auth.secret_text, timeoutSeconds, 'crawl'),
      auth: auth.secret_text,
    });

    if (propsValue.formats === 'screenshot' && Array.isArray(result.data)) {
      const savedPages: Record<string, unknown>[] = [];
      for (const page of result.data) {
        const { screenshot, ...pageWithoutScreenshot } = page;
        if (typeof screenshot !== 'string' || !screenshot) {
          savedPages.push(page);
          continue;
        }
        const { data: savedScreenshot, error } = await tryCatch(() =>
          saveFirecrawlFile({ context, firecrawlFileUrl: screenshot })
        );
        savedPages.push(
          error
            ? { ...pageWithoutScreenshot, screenshotError: screenshotErrorMessage(error) }
            : { ...page, screenshot: savedScreenshot }
        );
      }
      result.data = savedPages;
    }

    return result;
  },
});

function screenshotErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return `Screenshot download failed (HTTP ${error.response.status})`;
  }
  return error instanceof Error ? error.message : String(error);
}
