import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { FathomAuth } from '../common/auth';

export const listMeetings = createAction({
  auth: FathomAuth,
  name: 'list_meetings',
  displayName: 'List Meetings',
  description: 'Retrieve a paginated list of meetings from your Fathom account with optional filters.',

  props: {
    calendar_invitees: Property.Array({
      displayName: 'Calendar Invitees',
      description: 'Email addresses of calendar invitees to filter by.',
      required: false,
    }),
    calendar_invitees_domains: Property.Array({
      displayName: 'Calendar Invitees Domains',
      description: 'Company domains to filter meetings by.',
      required: false,
    }),
    calendar_invitees_domains_type: Property.StaticDropdown({
      displayName: 'Calendar Invitees Domains Type',
      description: 'Filter meetings by internal or external domains.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Only Internal', value: 'only_internal' },
          { label: 'One or More External', value: 'one_or_more_external' },
        ],
      },
    }),
    created_after: Property.ShortText({
      displayName: 'Created After (ISO Timestamp)',
      description: 'Filter meetings created after this timestamp (e.g. 2025-01-01T00:00:00Z).',
      required: false,
    }),
    created_before: Property.ShortText({
      displayName: 'Created Before (ISO Timestamp)',
      description: 'Filter meetings created before this timestamp (e.g. 2025-12-31T23:59:59Z).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response).',
      required: false,
    }),
    include_action_items: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include the action items for each meeting.',
      required: false,
      defaultValue: false,
    }),
    include_crm_matches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches for each meeting.',
      required: false,
      defaultValue: false,
    }),
    include_summary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary for each meeting (unavailable for OAuth apps).',
      required: false,
      defaultValue: false,
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript for each meeting (unavailable for OAuth apps).',
      required: false,
      defaultValue: false,
    }),
    recorded_by: Property.Array({
      displayName: 'Recorded By',
      description: 'Email addresses of users who recorded meetings.',
      required: false,
    }),
    teams: Property.Array({
      displayName: 'Teams',
      description: 'Filter meetings by team names.',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, any> = {};

    for (const key of Object.keys(propsValue) as Array<keyof typeof propsValue>) {
      const value = propsValue[key];
      if (Array.isArray(value) && value.length > 0) {
        queryParams[`${String(key)}[]`] = value;
      } else if (value !== undefined && value !== null && value !== '') {
        queryParams[String(key)] = value;
      }
    }

    const buildQueryString = (params: Record<string, any>) => {
      const parts: string[] = [];
      for (const key in params) {
        const val = params[key];
        if (Array.isArray(val)) {
          for (const v of val) {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
          }
        } else {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
        }
      }
      return parts.join('&');
    };

    const qs = Object.keys(queryParams).length ? `?${buildQueryString(queryParams)}` : '';

    const result = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/meetings${qs}`
    );

    return result;
  },
});
