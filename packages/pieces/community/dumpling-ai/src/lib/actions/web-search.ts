import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

/**
 * Web Search Action
 *
 * This action allows users to search the web using Dumpling AI's search capabilities.
 * It supports various search parameters and can optionally scrape and process the
 * content of top search results.
 */
export const webSearch = createAction({
  // Basic action information
  name: 'web_search',
  displayName: 'Web Search',
  description: 'Search the web with advanced filtering and optional content extraction from results',
  auth: dumplingAuth,

  // Input properties
  props: {
    // Core search parameters
    query: Property.LongText({
      displayName: 'Search Query',
      required: true,
      description: 'Enter your search query - be as specific as possible for better results',
    }),

    // Regional settings
    regionSettings: Property.MarkDown({
      value: '### Regional Settings (Optional)\nCustomize where and when to search',
    }),

    country: Property.ShortText({
      displayName: 'Country Code',
      required: false,
      description: 'Two-letter country code for location bias (e.g., "US", "GB", "JP")',
    }),

    location: Property.ShortText({
      displayName: 'Specific Location',
      required: false,
      description: 'Narrow results to a specific location (e.g., "San Francisco, CA")',
    }),

    language: Property.ShortText({
      displayName: 'Language Code',
      required: false,
      description: 'Filter results by language (e.g., "en", "es", "fr", "de")',
    }),

    // Time filters
    dateRange: Property.StaticDropdown({
      displayName: 'Time Range',
      required: false,
      options: {
        options: [
          { label: 'Any Time', value: 'anyTime' },
          { label: 'Past Hour', value: 'pastHour' },
          { label: 'Past 24 Hours', value: 'pastDay' },
          { label: 'Past 7 Days', value: 'pastWeek' },
          { label: 'Past 30 Days', value: 'pastMonth' },
          { label: 'Past 12 Months', value: 'pastYear' },
        ],
      },
      description: 'Limit results to a specific time period',
    }),

    // Pagination
    page: Property.Number({
      displayName: 'Results Page',
      required: false,
      description: 'Page number for paginated results (starts at 1)',
    }),

    // Content extraction options
    contentOptions: Property.MarkDown({
      value: '### Content Extraction (Optional)\nAutomatically extract content from search results',
    }),

    scrapeResults: Property.Checkbox({
      displayName: 'Extract Content from Results',
      required: false,
      defaultValue: false,
      description: 'When enabled, Dumpling AI will visit and extract content from top search results',
    }),

    numResultsToScrape: Property.Number({
      displayName: 'Number of Results to Process',
      required: false,
      defaultValue: 3,
      description: 'How many top results to extract content from (1-10)',
    }),

    scrapeFormat: Property.StaticDropdown({
      displayName: 'Content Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown (Formatted Text)', value: 'markdown' },
          { label: 'HTML (Web Code)', value: 'html' },
          { label: 'Screenshot (Image)', value: 'screenshot' },
        ],
      },
      description: 'Format to use when extracting content from results',
    }),

    cleanedOutput: Property.Checkbox({
      displayName: 'Clean Extracted Content',
      required: false,
      defaultValue: true,
      description: 'Remove ads, navigation elements, and other clutter from extracted content',
    }),
  },

  // Action implementation
  async run(context) {
    // Extract all properties from context
    const {
      query,
      country,
      location,
      language,
      dateRange,
      page,
      scrapeResults,
      numResultsToScrape,
      scrapeFormat,
      cleanedOutput
    } = context.propsValue;

    // Build the request body starting with required parameters
    const requestBody: Record<string, any> = {
      query: query.trim()
    };

    // Add location parameters if provided
    if (country) requestBody['country'] = country.toUpperCase();
    if (location) requestBody['location'] = location;
    if (language) requestBody['language'] = language.toLowerCase();

    // Add time and pagination parameters
    if (dateRange) requestBody['dateRange'] = dateRange;
    if (page && page > 0) requestBody['page'] = page;

    // Configure content extraction if enabled
    if (scrapeResults === true) {
      requestBody['scrapeResults'] = true;

      // Limit number of results to scrape (1-10)
      const resultsToScrape = numResultsToScrape || 3;
      requestBody['numResultsToScrape'] = Math.min(Math.max(1, resultsToScrape), 10);

      // Configure scraping options
      requestBody['scrapeOptions'] = {
        format: scrapeFormat || 'markdown',
        cleaned: cleanedOutput !== false // Default to true if not specified
      };
    }

    try {
      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.auth}`,
          'User-Agent': 'Activepieces-DumplingAI-Integration/1.0'
        },
        body: requestBody,
      });

      // Return the response data
      return response.body;
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to perform web search: ${errorMessage}`);
    }
  },
});
