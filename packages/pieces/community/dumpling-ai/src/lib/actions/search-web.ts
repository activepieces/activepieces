import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const searchWeb = createAction({
  name: 'search_web',
  auth: dumplingAuth,
  displayName: 'Web Search',
  description: 'Search the web and optionally retrieve content from top results',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'The search query to perform',
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
      description: 'Two-letter country code for location bias (e.g., "US" for United States)',
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
      description: 'Specific location to focus the search (e.g., "New York, NY")',
    }),
    language: Property.ShortText({
      displayName: 'Language',
      required: false,
      description: 'Language code for the search results (e.g., "en" for English)',
    }),
    dateRange: Property.StaticDropdown({
      displayName: 'Date Range',
      required: false,
      options: {
        options: [
          { label: 'Any Time', value: 'anyTime' },
          { label: 'Past Hour', value: 'pastHour' },
          { label: 'Past Day', value: 'pastDay' },
          { label: 'Past Week', value: 'pastWeek' },
          { label: 'Past Month', value: 'pastMonth' },
          { label: 'Past Year', value: 'pastYear' },
        ]
      },
      description: 'Filter results by date',
    }),
    scrapeResults: Property.Checkbox({
      displayName: 'Scrape Results',
      required: false,
      defaultValue: false,
      description: 'Whether to scrape the top search results',
    }),
    numResultsToScrape: Property.Number({
      displayName: 'Number of Results to Scrape',
      required: false,
      defaultValue: 3,
      description: 'Number of top results to scrape (max: 10)',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      query,
      country,
      location,
      language,
      dateRange,
      scrapeResults,
      numResultsToScrape
    } = propsValue;

    const requestBody: Record<string, any> = {
      query
    };

    // Add optional parameters if provided
    if (country) requestBody['country'] = country;
    if (location) requestBody['location'] = location;
    if (language) requestBody['language'] = language;
    if (dateRange) requestBody['dateRange'] = dateRange;
    if (scrapeResults !== undefined) requestBody['scrapeResults'] = scrapeResults;
    if (numResultsToScrape) requestBody['numResultsToScrape'] = numResultsToScrape;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DUMPLING_API_URL}/search`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 