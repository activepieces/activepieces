import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

// Date range options with descriptions
const DATE_RANGE_OPTIONS = [
  { label: 'Any Time (All Available News)', value: 'anyTime' },
  { label: 'Past Hour (Breaking News)', value: 'pastHour' },
  { label: 'Past 24 Hours (Today\'s News)', value: 'pastDay' },
  { label: 'Past 7 Days (This Week)', value: 'pastWeek' },
  { label: 'Past 30 Days (This Month)', value: 'pastMonth' },
  { label: 'Past 12 Months (This Year)', value: 'pastYear' },
];

// Common language codes
const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

/**
 * News Search Action
 *
 * This action searches for recent news articles across thousands of news sources
 * using Dumpling AI's news search capabilities. It can filter by region, language,
 * and time period to find the most relevant news for any topic.
 */
export const searchNews = createAction({
  // Basic action information
  name: 'search_news',
  displayName: 'Find News Articles',
  description: 'Search for recent news articles from thousands of sources worldwide',
  auth: dumplingAuth,

  // Input properties
  props: {
    // Introduction
    introHelp: Property.MarkDown({
      value: `### News Search
Find recent news articles about any topic, company, person, or event from thousands of news sources worldwide.

This action is ideal for:
- Monitoring company or competitor mentions
- Tracking industry trends
- Researching current events
- Finding the latest information on any topic`
    }),

    // Search configuration
    searchSection: Property.MarkDown({
      value: '### Search Parameters'
    }),

    query: Property.LongText({
      displayName: 'News Topic or Keywords',
      required: true,
      description: 'What news are you looking for? Be specific for better results.',
    }),

    // Regional settings
    regionSection: Property.MarkDown({
      value: '### Regional Settings (Optional)'
    }),

    country: Property.ShortText({
      displayName: 'Country Code',
      required: false,
      description: 'Two-letter country code to focus on news from a specific country (e.g., "US", "GB", "JP")',
    }),

    location: Property.ShortText({
      displayName: 'Specific Location',
      required: false,
      description: 'City or region to focus on local news (e.g., "San Francisco", "London")',
    }),

    languageHelp: Property.MarkDown({
      value: `Common language codes: ${COMMON_LANGUAGES.map(l => `${l.code} (${l.name})`).join(', ')}`
    }),

    language: Property.ShortText({
      displayName: 'Language Code',
      required: false,
      description: 'Two-letter language code for the news articles (e.g., "en" for English)',
    }),

    // Time settings
    timeSection: Property.MarkDown({
      value: '### Time Period'
    }),

    dateRange: Property.StaticDropdown({
      displayName: 'News Timeframe',
      required: false,
      options: {
        options: DATE_RANGE_OPTIONS,
      },
      description: 'How recent should the news articles be?',
    }),

    // Pagination
    paginationSection: Property.MarkDown({
      value: '### Pagination'
    }),

    page: Property.Number({
      displayName: 'Results Page',
      required: false,
      description: 'Page number for viewing more results (starts at 1)',
    }),
  },

  // Action implementation
  async run(context) {
    // Extract properties from context
    const {
      query,
      country,
      location,
      language,
      dateRange,
      page
    } = context.propsValue;

    // Validate search query
    if (!query || query.trim().length === 0) {
      throw new Error('Please provide a search topic or keywords');
    }

    // Build request body
    const requestBody = {
      // Required parameter
      query: query.trim(),

      // Optional parameters
      ...(country && { country: country.toUpperCase() }),
      ...(location && { location }),
      ...(language && { language: language.toLowerCase() }),
      ...(dateRange && { dateRange }),
      ...(page && page > 0 && { page })
    };

    try {
      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/search-news',
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
          search_query: query.trim(),
          region_filters: {
            country: country || 'global',
            location: location || 'any',
            language: language || 'any'
          },
          time_period: dateRange || 'anyTime',
          page_number: page || 1,
          searched_at: new Date().toISOString()
        }
      };
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`News search failed: ${errorMessage}`);
    }
  },
});
