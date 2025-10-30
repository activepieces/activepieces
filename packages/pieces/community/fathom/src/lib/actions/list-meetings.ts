import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listMeetings = createAction({
  name: 'listMeetings',
  displayName: 'List Meetings',
  description: 'List meetings with filtering and pagination',
  auth: fathomAuth,
  props: {
    calendar_invitees: Property.Array({
      displayName: 'Calendar Invitees',
      description: 'Email addresses of calendar invitees to filter by',
      required: false,
    }),
    calendar_invitees_domains: Property.Array({
      displayName: 'Calendar Invitees Domains',
      description: 'Domains of the companies to filter by (e.g., acme.com)',
      required: false,
    }),
    calendar_invitees_domains_type: Property.StaticDropdown({
      displayName: 'Calendar Invitees Domains Type',
      description: 'Filter by whether calendar invitee list includes external email domains',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Only Internal', value: 'only_internal' },
          { label: 'One or More External', value: 'one_or_more_external' },
        ],
      },
      defaultValue: 'all',
    }),
    recorded_by: Property.Array({
      displayName: 'Recorded By',
      description: 'Email addresses of users who recorded meetings',
      required: false,
    }),
    teams: Property.Array({
      displayName: 'Teams',
      description: 'Team names to filter by (e.g., Sales, Engineering)',
      required: false,
    }),
    created_after: Property.ShortText({
      displayName: 'Created After',
      description: 'Filter to meetings created after this timestamp (e.g., 2025-01-01T00:00:00Z)',
      required: false,
    }),
    created_before: Property.ShortText({
      displayName: 'Created Before',
      description: 'Filter to meetings created before this timestamp (e.g., 2025-01-01T00:00:00Z)',
      required: false,
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript for each meeting',
      required: false,
      defaultValue: false,
    }),
    include_summary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary for each meeting',
      required: false,
      defaultValue: false,
    }),
    include_action_items: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include the action items for each meeting',
      required: false,
      defaultValue: false,
    }),
    include_crm_matches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches for each meeting',
      required: false,
      defaultValue: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams = new URLSearchParams();

    if (propsValue.calendar_invitees && Array.isArray(propsValue.calendar_invitees)) {
      propsValue.calendar_invitees.forEach((email) => {
        queryParams.append('calendar_invitees[]', email as string);
      });
    }

    if (propsValue.calendar_invitees_domains && Array.isArray(propsValue.calendar_invitees_domains)) {
      propsValue.calendar_invitees_domains.forEach((domain) => {
        queryParams.append('calendar_invitees_domains[]', domain as string);
      });
    }

    if (propsValue.calendar_invitees_domains_type && propsValue.calendar_invitees_domains_type !== 'all') {
      queryParams.append('calendar_invitees_domains_type', propsValue.calendar_invitees_domains_type as string);
    }

    if (propsValue.recorded_by && Array.isArray(propsValue.recorded_by)) {
      propsValue.recorded_by.forEach((email) => {
        queryParams.append('recorded_by[]', email as string);
      });
    }

    if (propsValue.teams && Array.isArray(propsValue.teams)) {
      propsValue.teams.forEach((team) => {
        queryParams.append('teams[]', team as string);
      });
    }

    if (propsValue.created_after) {
      queryParams.append('created_after', propsValue.created_after);
    }

    if (propsValue.created_before) {
      queryParams.append('created_before', propsValue.created_before);
    }

    if (propsValue.include_transcript) {
      queryParams.append('include_transcript', 'true');
    }

    if (propsValue.include_summary) {
      queryParams.append('include_summary', 'true');
    }

    if (propsValue.include_action_items) {
      queryParams.append('include_action_items', 'true');
    }

    if (propsValue.include_crm_matches) {
      queryParams.append('include_crm_matches', 'true');
    }

    if (propsValue.cursor) {
      queryParams.append('cursor', propsValue.cursor);
    }

    const url = `https://api.fathom.ai/external/v1/meetings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      headers: {
        'X-Api-Key': auth,
      },
    });

    return response.body;
  },
});
