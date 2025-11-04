import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapelessApiAuth } from '../../index';
import { createScrapelessClient } from '../services/scrapeless-api-client';

export const googleSearchApi = createAction({
  auth: scrapelessApiAuth,
  name: 'google_search_api',
  displayName: 'Google Search',
  description: 'Retrieves search result data for any query.',

  props: {
    q: Property.ShortText({
      displayName: 'Search Query',
      description: 'Parameter defines the query you want to search. You can use anything that you would use in a regular Google search. e.g. inurl:, site:, intitle:. We also support advanced search query parameters such as as_dt and as_eq.',
      defaultValue: 'coffee',
      required: true,
    }),
    hl: Property.ShortText({
      displayName: 'Language',
      description: "Parameter defines the language to use for the Google search. It's a two-letter language code. (e.g., en for English, es for Spanish, or fr for French).",
      defaultValue: 'en',
      required: false,
    }),
    gl: Property.ShortText({
      displayName: 'Country',
      description: "Parameter defines the country to use for the Google search. It's a two-letter country code. (e.g., us for the United States, uk for United Kingdom, or fr for France).",
      defaultValue: 'us',
      required: false,
    }),
  },

  async run({ propsValue, auth }) {
    try {
      const client = createScrapelessClient(auth);

      const input = {
        q: propsValue.q,
        hl: propsValue.hl,
        gl: propsValue.gl,
      }

      const response = await client.deepserp.createTask({
        actor: 'scraper.google.search',
        input,
      });

      if (response.status === 200) {
        return {
          success: true,
          data: response.data || null,
        }
      }

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await client.deepserp.getTaskResult(response.data.taskId);

        if (result.status === 200) {
          return {
            success: true,
            data: result.data || null,
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
      };
    }
  },
});
