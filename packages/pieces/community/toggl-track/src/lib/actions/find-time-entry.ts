import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';

type TimeEntry = {
    id: number;
    description: string;
    [key: string]: unknown;
}

export const findTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Finds time entries with a matching description within a specified date range.',
  props: {
    description: Property.ShortText({
        displayName: 'Description Contains',
        description: 'The text to search for in the time entry description (case-insensitive).',
        required: true,
    }),
    start_date: Property.ShortText({
        displayName: 'Start Date',
        description: 'The start of the date range to search within (e.g., YYYY-MM-DD).',
        required: true,
    }),
    end_date: Property.ShortText({
        displayName: 'End Date',
        description: 'The end of the date range to search within (e.g., YYYY-MM-DD).',
        required: true,
    }),
  },
  async run(context) {
    const { description, start_date, end_date } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = {
        start_date: start_date,
        end_date: end_date,
    };

    
    const response = await httpClient.sendRequest<TimeEntry[]>({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/me/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: queryParams
    });

    const timeEntries = response.body || [];

    
    const matchingEntries = timeEntries.filter(entry => 
        entry.description && entry.description.toLowerCase().includes(description.toLowerCase())
    );

    return matchingEntries;
  },
});