import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

export const getGoogleTrendsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_google_trends',
  displayName: 'Get Google Trends',
  description: 'Gets Google Trends data for one or more keywords.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Gets Google Trends data for keywords: interest over time, interest by region, compared breakdown by region, related queries, related topics or autocomplete suggestions. Interest over time and compared breakdown accept up to 5 comma-separated keywords; the other types take one. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Keywords',
      description:
        'Keyword, or up to 5 comma-separated keywords for interest over time and compared breakdown, e.g. "Mercedes-Benz,BMW X5".',
      required: true,
    }),
    dataType: Property.StaticDropdown({
      displayName: 'Data Type',
      description: 'Which Trends report to return.',
      required: true,
      options: {
        options: [
          { label: 'Interest over time', value: 'interest_over_time' },
          {
            label: 'Compared breakdown by region',
            value: 'compared_breakdown_by_region',
          },
          { label: 'Interest by region', value: 'interest_by_subregion' },
          { label: 'Related queries', value: 'related_queries' },
          { label: 'Related topics', value: 'related_topics' },
          { label: 'Autocomplete', value: 'autocomplete' },
        ],
      },
    }),
    date: Property.ShortText({
      displayName: 'Date Range',
      description:
        'One of "now 1-H", "now 4-H", "now 1-d", "now 7-d", "today 1-m", "today 3-m", "today 12-m", "today 5-y", "all", or a custom "YYYY-MM-DD YYYY-MM-DD" range.',
      required: true,
    }),
    language: scrapelessAiProps.language({ required: false }),
    timezoneOffset: Property.ShortText({
      displayName: 'Timezone Offset',
      description:
        'Timezone offset in minutes from UTC, e.g. "420" (the default) or "-60".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.trends',
      input: {
        q: propsValue.query,
        data_type: propsValue.dataType,
        date: propsValue.date,
        hl: propsValue.language,
        tz: propsValue.timezoneOffset,
      },
    });
  },
});
