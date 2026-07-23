import { createAction } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken } from '../common';

interface SettingItem {
  kind: string;
  etag: string;
  id: string;
  value: string;
}

interface SettingsListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: SettingItem[];
}

export const aiListSettings = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_list_settings',
  displayName: 'List Settings',
  description:
    'List the user\'s Google Calendar account settings (time zone, week start, date/time format, and more).',
  audience: 'ai',
  aiMetadata: {
    description:
      'List all of the user\'s Google Calendar account settings as id/value pairs — including the account "timezone", "weekStart", and "format24HourTime". Use this to read the account time zone to anchor relative-date reasoning before building event windows, or to read a single setting (just pick its id from the returned list). Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = await getAccessToken(context.auth);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/users/me/settings`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest<SettingsListResponse>(request);
    const items = response.body.items ?? [];

    const settings: Record<string, string> = {};
    for (const item of items) {
      settings[item.id] = item.value;
    }

    return {
      settings,
      items,
      count: items.length,
    };
  },
});
