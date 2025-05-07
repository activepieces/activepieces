import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

// Format options with descriptions
const FORMAT_OPTIONS = [
  {
    label: 'Markdown (Formatted Text)',
    value: 'markdown',
    description: 'Clean, formatted text with basic styling'
  },
  {
    label: 'Plain Text (No Formatting)',
    value: 'text',
    description: 'Simple text without any formatting'
  },
  {
    label: 'Raw (Complete Data)',
    value: 'raw',
    description: 'Full raw data including metadata'
  },
];

/**
 * Website Crawling Action
 *
 * This action explores multiple pages of a website to extract comprehensive
 * content across the site. It follows links within the domain to gather
 * information from related pages.
 */
export const crawlWebsite = createAction({
  // Basic action information
  name: 'crawl_website',
  displayName: 'Crawl Website (Multi-Page)',
  description: 'Explore and extract content from multiple pages across a website',
  auth: dumplingAuth,

  // Input properties
  props: {
    // Introduction
    introHelp: Property.MarkDown({
      value: `### Website Crawler
This action will:
1. Start at the URL you provide
2. Follow links to other pages on the same domain
3. Extract content from all discovered pages
4. Return a comprehensive dataset of the website's content

This is ideal for analyzing entire websites, documentation, blogs, or knowledge bases.`
    }),

    // Target configuration
    targetSection: Property.MarkDown({
      value: '### Target Website'
    }),

    url: Property.ShortText({
      displayName: 'Starting URL',
      required: true,
      description: 'The URL where crawling will begin (homepage or section page)',
    }),

    // Crawl settings
    crawlSection: Property.MarkDown({
      value: '### Crawl Settings'
    }),

    limit: Property.Number({
      displayName: 'Maximum Pages',
      required: false,
      defaultValue: 5,
      description: 'Limit how many pages to process (higher values take longer but are more comprehensive)',
    }),

    depth: Property.Number({
      displayName: 'Crawl Depth',
      required: false,
      defaultValue: 2,
      description: 'How many links deep to follow from the starting page (1-5)',
    }),

    // Output settings
    outputSection: Property.MarkDown({
      value: '### Output Settings'
    }),

    format: Property.StaticDropdown({
      displayName: 'Content Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: FORMAT_OPTIONS,
      },
      description: 'How you want the extracted content to be formatted',
    }),
  },

  // Action implementation
  async run(context) {
    // Extract properties from context
    const {
      url,
      limit,
      depth,
      format
    } = context.propsValue;

    // Validate URL
    if (!url || !url.trim().startsWith('http')) {
      throw new Error('Please provide a valid URL starting with http:// or https://');
    }

    // Validate numeric inputs
    const pageLimit = limit !== undefined ? Math.min(Math.max(1, limit), 50) : 5;
    const crawlDepth = depth !== undefined ? Math.min(Math.max(1, depth), 5) : 2;

    // Build request body
    const requestBody = {
      // Required parameter
      url: url.trim(),

      // Optional parameters with defaults and validation
      limit: pageLimit,
      depth: crawlDepth,
      format: format || 'markdown'
    };

    try {
      // Log the crawl attempt
      console.log(`Starting website crawl at ${url} with depth ${crawlDepth} and limit ${pageLimit}`);

      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/crawl',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.auth}`,
          'User-Agent': 'Activepieces-DumplingAI-Integration/1.0'
        },
        body: requestBody,
      });

      // Process and return the response
      const result = response.body;

      // Add helpful metadata to the response
      return {
        ...result,
        _metadata: {
          starting_url: url.trim(),
          max_pages: pageLimit,
          crawl_depth: crawlDepth,
          format_used: format || 'markdown',
          crawled_at: new Date().toISOString()
        }
      };
    } catch (error) {
      // Handle common errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
        const status = error.response.status;
        if (status === 403) {
          throw new Error('Access denied. The website may be blocking crawling attempts or has a robots.txt restriction.');
        } else if (status === 404) {
          throw new Error('The starting URL could not be found. Please check the URL and try again.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. The website is limiting the number of requests.');
        }
      }
      throw new Error(`Website crawling failed: ${errorMessage}`);
    }
  },
});
