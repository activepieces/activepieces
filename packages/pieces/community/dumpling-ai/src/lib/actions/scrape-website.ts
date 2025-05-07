import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

// Output format options with descriptions
const FORMAT_OPTIONS = [
  {
    label: 'Markdown (Formatted Text)',
    value: 'markdown',
    description: 'Clean, formatted text with basic styling'
  },
  {
    label: 'HTML (Web Code)',
    value: 'html',
    description: 'Raw HTML code from the page'
  },
  {
    label: 'Screenshot (Image)',
    value: 'screenshot',
    description: 'Visual capture of the webpage'
  },
];

/**
 * Website Scraping Action
 *
 * This action extracts content from a single webpage using Dumpling AI's
 * advanced scraping capabilities. It can handle JavaScript-rendered sites
 * and clean up the content for better readability.
 */
export const scrapeWebsite = createAction({
  // Basic action information
  name: 'scrape_website',
  displayName: 'Extract Website Content',
  description: 'Capture and extract content from any webpage with advanced processing options',
  auth: dumplingAuth,

  // Input properties
  props: {
    // Target configuration
    targetSection: Property.MarkDown({
      value: '### Target Website'
    }),

    url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description: 'The complete URL of the webpage to extract content from',
    }),

    urlHelp: Property.MarkDown({
      value: 'Make sure to include the full URL including https:// or http://'
    }),

    // Output configuration
    outputSection: Property.MarkDown({
      value: '### Output Configuration'
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

    // Processing options
    processingSection: Property.MarkDown({
      value: '### Processing Options'
    }),

    cleaned: Property.Checkbox({
      displayName: 'Clean & Simplify Content',
      required: false,
      defaultValue: true,
      description: 'Remove ads, navigation elements, and other clutter for cleaner results',
    }),

    renderJs: Property.Checkbox({
      displayName: 'Process JavaScript',
      required: false,
      defaultValue: true,
      description: 'Enable to properly extract content from modern websites that use JavaScript to load content',
    }),
  },

  // Action implementation
  async run(context) {
    // Extract properties from context
    const {
      url,
      format,
      cleaned,
      renderJs
    } = context.propsValue;

    // Validate URL
    if (!url || !url.trim().startsWith('http')) {
      throw new Error('Please provide a valid URL starting with http:// or https://');
    }

    // Build request body
    const requestBody = {
      // Required parameter
      url: url.trim(),

      // Optional parameters with defaults
      format: format || 'markdown',
      cleaned: cleaned !== false, // Default to true if not specified
      renderJs: renderJs !== false, // Default to true if not specified
    };

    try {
      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/scrape',
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
          source_url: url.trim(),
          format_used: format || 'markdown',
          content_cleaned: cleaned !== false,
          javascript_rendered: renderJs !== false,
          extracted_at: new Date().toISOString()
        }
      };
    } catch (error) {
      // Handle common errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
        const status = error.response.status;
        if (status === 403) {
          throw new Error('Access denied. The website may be blocking scraping attempts.');
        } else if (status === 404) {
          throw new Error('The requested URL could not be found. Please check the URL and try again.');
        }
      }
      throw new Error(`Website extraction failed: ${errorMessage}`);
    }
  },
});
