import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const startCrawl = createAction({
  auth: firecrawlAuth,
  name: 'startCrawl',
  displayName: 'Start Crawl',
  description: 'Start crawling multiple pages from a website based on specified rules and patterns.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The base URL to start crawling from.',
      required: true,
    }),
    excludePaths: Property.Array({
      displayName: 'Exclude Paths',
      description: 'URL pathname regex patterns that exclude matching URLs from the crawl. For example, if you set "excludePaths": ["blog/.*"] for the base URL firecrawl.dev, any results matching that pattern will be excluded, such as https://www.firecrawl.dev/blog/firecrawl-launch-week-1-recap.',
      required: false,
      defaultValue: [],
    }),
    includePaths: Property.Array({
      displayName: 'Include Paths',
      description: 'URL pathname regex patterns that include matching URLs in the crawl. Only the paths that match the specified patterns will be included in the response. For example, if you set "includePaths": ["blog/.*"] for the base URL firecrawl.dev, only results matching that pattern will be included, such as https://www.firecrawl.dev/blog/firecrawl-launch-week-1-recap.',
      required: false,
      defaultValue: [],
    }),
    maxDepth: Property.Number({
      displayName: 'Maximum Path Depth',
      description: 'Maximum depth to crawl relative to the base URL. Basically, the max number of slashes the pathname of a scraped URL may contain.',
      required: false,
      defaultValue: 10,
    }),
    maxDiscoveryDepth: Property.Number({
      displayName: 'Maximum Discovery Depth',
      description: 'Maximum depth to crawl based on discovery order. The root site and sitemapped pages has a discovery depth of 0. For example, if you set it to 1, and you set ignoreSitemap, you will only crawl the entered URL and all URLs that are linked on that page.',
      required: false,
      defaultValue: 10,
    }),
    ignoreSitemap: Property.Checkbox({
      displayName: 'Ignore Sitemap',
      description: 'Ignore the website sitemap when crawling',
      required: false,
      defaultValue: false,
    }),
    ignoreQueryParameters: Property.Checkbox({
      displayName: 'Ignore Query Parameters',
      description: 'Do not re-scrape the same path with different (or none) query parameters',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pages to crawl. Default limit is 10000.',
      required: false,
      defaultValue: 10000,
    }),
    allowBackwardLinks: Property.Checkbox({
      displayName: 'Allow Backward Links',
      description: 'Enables the crawler to navigate from a specific URL to previously linked pages.',
      required: false,
      defaultValue: false,
    }),
    allowExternalLinks: Property.Checkbox({
      displayName: 'Allow External Links',
      description: 'Allows the crawler to follow links to external websites.',
      required: false,
      defaultValue: false,
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
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const useWebhook = propsValue['useWebhook'] as unknown as boolean;
        
        if (!useWebhook) {
          return {};
        }
        
        return {
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
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      url: propsValue.url,
    };

    if (propsValue.excludePaths && Array.isArray(propsValue.excludePaths) && propsValue.excludePaths.length > 0) {
      body['excludePaths'] = propsValue.excludePaths;
    }

    if (propsValue.includePaths && Array.isArray(propsValue.includePaths) && propsValue.includePaths.length > 0) {
      body['includePaths'] = propsValue.includePaths;
    }

    if (propsValue.maxDepth !== undefined) {
      body['maxDepth'] = propsValue.maxDepth;
    }

    if (propsValue.maxDiscoveryDepth !== undefined) {
      body['maxDiscoveryDepth'] = propsValue.maxDiscoveryDepth;
    }

    if (propsValue.ignoreSitemap !== undefined) {
      body['ignoreSitemap'] = propsValue.ignoreSitemap;
    }

    if (propsValue.ignoreQueryParameters !== undefined) {
      body['ignoreQueryParameters'] = propsValue.ignoreQueryParameters;
    }

    if (propsValue.limit !== undefined) {
      body['limit'] = propsValue.limit;
    }

    if (propsValue.allowBackwardLinks !== undefined) {
      body['allowBackwardLinks'] = propsValue.allowBackwardLinks;
    }

    if (propsValue.allowExternalLinks !== undefined) {
      body['allowExternalLinks'] = propsValue.allowExternalLinks;
    }

    // Add webhook configuration if enabled
    if (propsValue.useWebhook && propsValue.webhookProperties) {
      const webhookUrl = propsValue.webhookProperties['webhookUrl'];
      if (webhookUrl) {
        body['webhook'] = {
          url: webhookUrl,
        };

        if (propsValue.webhookProperties['webhookHeaders']) {
          body['webhook']['headers'] = propsValue.webhookProperties['webhookHeaders'];
        }

        if (propsValue.webhookProperties['webhookMetadata']) {
          body['webhook']['metadata'] = propsValue.webhookProperties['webhookMetadata'];
        }

        if (propsValue.webhookProperties['webhookEvents'] && Array.isArray(propsValue.webhookProperties['webhookEvents']) && propsValue.webhookProperties['webhookEvents'].length > 0) {
          body['webhook']['events'] = propsValue.webhookProperties['webhookEvents'];
        }
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.firecrawl.dev/v1/crawl',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    return response.body;
  },
}); 