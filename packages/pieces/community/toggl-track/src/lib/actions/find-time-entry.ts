import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';

export const findTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Find time entries by description.',
  props: {
    description: Property.ShortText({
      displayName: 'Description Contains',
      description:
        'Search for time entries containing this text in description.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Get entries from start_date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Get entries until end_date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Before Date',
      description:
        'Get entries before given date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    since: Property.Number({
      displayName: 'Since Timestamp',
      description: 'Get entries modified since this UNIX timestamp.',
      required: false,
    }),
    meta: Property.Checkbox({
      displayName: 'Include Meta Data',
      description: 'Should the response contain data for meta entities.',
      required: false,
      defaultValue: false,
    }),
    include_sharing: Property.Checkbox({
      displayName: 'Include Sharing',
      description: 'Include sharing details in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      description,
      start_date,
      end_date,
      before,
      since,
      meta,
      include_sharing,
    } = context.propsValue;
    const apiToken = context.auth;

    const queryParams: QueryParams = {};
    if (start_date) queryParams['start_date'] = start_date;
    if (end_date) queryParams['end_date'] = end_date;
    if (before) queryParams['before'] = before;
    if (since) queryParams['since'] = since.toString();
    if (meta !== undefined) queryParams['meta'] = meta.toString();
    if (include_sharing !== undefined)
      queryParams['include_sharing'] = include_sharing.toString();

    const response = await httpClient.sendRequest<{
      items: { id: number; description: string; [key: string]: unknown }[];
    }>({
      method: HttpMethod.GET,
      url: `https://api.track.toggl.com/api/v9/me/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      queryParams: queryParams,
    });

    const timeEntries = response.body.items || [];

    if (description) {
      const matchingEntries = timeEntries.filter(
        (entry) =>
          entry.description &&
          entry.description.toLowerCase().includes(description.toLowerCase())
      );
      return { items: matchingEntries };
    }

    return response.body;
  },
});
