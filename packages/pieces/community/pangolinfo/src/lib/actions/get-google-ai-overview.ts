import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';

const getGoogleAiOverview = createAction({
  name: 'get_google_ai_overview',
  displayName: 'Get Google AI Overview',
  description:
    'Extract a Google AI Overview, cited sources, and organic results with the Pangolinfo AI Overview SERP API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves current Google AI Overview content, citations, and organic results for a query. Use for GEO, brand visibility, citation monitoring, and AI search research. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Google query used to retrieve AI search results.',
      required: true,
    }),
    screenshot: Property.Checkbox({
      displayName: 'Include Screenshot',
      description: 'Include a visual screenshot when supported.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { query, screenshot } = context.propsValue;
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/scrape',
      body: {
        parserName: 'googleSearch',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        screenshot: screenshot ?? false,
      },
    });
  },
});

export { getGoogleAiOverview };
