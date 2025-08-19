import { scrapelessApiAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleTrendsDataTypeOptions } from '../constants';
import { createScrapelessClient } from '../services/scrapeless-api-client';

export const googleTrendsApi = createAction({
  auth: scrapelessApiAuth,
  name: 'google_trends_api',
  displayName: 'Google Trends',
  description: 'Access popular keyword and interest data from Google Trends.',

  props: {
    q: Property.ShortText({
      displayName: 'Search Query',
      description: 'Parameter defines the query or queries you want to search. You can use anything that you would use in a regular Google Trends search. The maximum number of queries per search is 5 (this only applies to `interest_over_time` and `compared_breakdown_by_region` data_type, other types of data will only accept 1 query per search).',
      defaultValue: 'Mercedes-Benz,BMW X5',
      required: true,
    }),
    data_type: Property.StaticDropdown({
      displayName: 'Data Type',
      description: 'Parameter defines the type of data you want to search. You can use anything that you would use in a regular Google Trends search. The maximum number of queries per search is 5 (this only applies to `interest_over_time` and `compared_breakdown_by_region` data_type, other types of data will only accept 1 query per search).',
      required: true,
      defaultValue: 'interest_over_time',
      options: {
        options: googleTrendsDataTypeOptions,
      },
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: "The supported dates are: `now 1-H`, `now 4-H`, `now 1-d`, `now 7-d`, `today 1-m`, `today 3-m`, `today 12-m`, `today 5-y`, `all`.You can also pass custom values:Dates from 2004 to present: `yyyy-mm-dd yyyy-mm-dd` (e.g. `2021-10-15 2022-05-25`)\nDates with hours within a week range: `yyyy-mm-ddThh yyyy-mm-ddThh` (e.g. `2022-05-19T10 2022-05-24T22`). Hours will be calculated depending on the tz (time zone) parameter.",
      required: true,
      defaultValue: 'today 1-m',
    }),
    hl: Property.ShortText({
      displayName: 'Language',
      description: "Parameter defines the language to use for the Google Trends search. It's a two-letter language code. (e.g., `en` for English, `es` for Spanish, or `fr` for French).",
      required: false,
      defaultValue: 'en',
    }),
    tz: Property.ShortText({
      displayName: 'Time zone',
      description: "time zone offset. default is `420`.",
      required: false,
      defaultValue: '420',
    }),



  },
  async run({ propsValue, auth }) {
    try {
      const client = createScrapelessClient(auth);

      const input = {
        q: propsValue.q,
        data_type: propsValue.data_type,
        date: propsValue.date,
        hl: propsValue.hl,
        tz: propsValue.tz,
      }

      const response = await client.deepserp.createTask({
        actor: 'scraper.google.trends',
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
