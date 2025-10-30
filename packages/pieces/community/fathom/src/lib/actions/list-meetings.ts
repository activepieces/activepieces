import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listMeetings = createAction({
  auth: fathomAuth,
  name: 'list-meetings',
  displayName: 'List Meetings',
  description: 'Retrieves a paginated list of meetings from Fathom with optional filters',
  props: {
    calendarInvitees: Property.Array({
      displayName: 'Calendar Invitees',
      description: 'Filter by calendar invitee email addresses (e.g., cfo@acme.com)',
      required: false,
    }),
    calendarInviteesDomains: Property.Array({
      displayName: 'Calendar Invitees Domains',
      description: 'Filter by company domains (e.g., acme.com, client.com)',
      required: false,
    }),
    calendarInviteesDomainsType: Property.StaticDropdown({
      displayName: 'Calendar Invitees Domains Type',
      description: 'Filter by whether calendar invitee list includes external email domains',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          {
            label: 'All',
            value: 'all',
          },
          {
            label: 'Only Internal',
            value: 'only_internal',
          },
          {
            label: 'One or More External',
            value: 'one_or_more_external',
          },
        ],
      },
    }),
    createdAfter: Property.DateTime({
      displayName: 'Created After',
      description: 'Filter to meetings created after this timestamp',
      required: false,
    }),
    createdBefore: Property.DateTime({
      displayName: 'Created Before',
      description: 'Filter to meetings created before this timestamp',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
    includeActionItems: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include action items for each meeting',
      required: false,
      defaultValue: false,
    }),
    includeCrmMatches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches for each meeting',
      required: false,
      defaultValue: false,
    }),
    includeSummary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include summary for each meeting',
      required: false,
      defaultValue: false,
    }),
    includeTranscript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include transcript for each meeting',
      required: false,
      defaultValue: false,
    }),
    recordedBy: Property.Array({
      displayName: 'Recorded By',
      description: 'Filter by email addresses of users who recorded meetings',
      required: false,
    }),
    teams: Property.Array({
      displayName: 'Teams',
      description: 'Filter by team names (e.g., Sales, Engineering)',
      required: false,
    }),
  },
  async run(context) {
    const {
      calendarInvitees,
      calendarInviteesDomains,
      calendarInviteesDomainsType,
      createdAfter,
      createdBefore,
      cursor,
      includeActionItems,
      includeCrmMatches,
      includeSummary,
      includeTranscript,
      recordedBy,
      teams,
    } = context.propsValue;

    // Build query parameters
    const queryParams: string[] = [];

    if (calendarInvitees && Array.isArray(calendarInvitees) && calendarInvitees.length > 0) {
      calendarInvitees.forEach((email) => {
        if (email && typeof email === 'string') {
          queryParams.push(`calendar_invitees[]=${encodeURIComponent(email)}`);
        }
      });
    }

    if (calendarInviteesDomains && Array.isArray(calendarInviteesDomains) && calendarInviteesDomains.length > 0) {
      calendarInviteesDomains.forEach((domain) => {
        if (domain && typeof domain === 'string') {
          queryParams.push(`calendar_invitees_domains[]=${encodeURIComponent(domain)}`);
        }
      });
    }

    if (calendarInviteesDomainsType && calendarInviteesDomainsType !== 'all') {
      queryParams.push(`calendar_invitees_domains_type=${calendarInviteesDomainsType}`);
    }

    if (createdAfter) {
      queryParams.push(`created_after=${encodeURIComponent(createdAfter)}`);
    }

    if (createdBefore) {
      queryParams.push(`created_before=${encodeURIComponent(createdBefore)}`);
    }

    if (cursor) {
      queryParams.push(`cursor=${encodeURIComponent(cursor)}`);
    }

    if (includeActionItems) {
      queryParams.push('include_action_items=true');
    }

    if (includeCrmMatches) {
      queryParams.push('include_crm_matches=true');
    }

    if (includeSummary) {
      queryParams.push('include_summary=true');
    }

    if (includeTranscript) {
      queryParams.push('include_transcript=true');
    }

    if (recordedBy && Array.isArray(recordedBy) && recordedBy.length > 0) {
      recordedBy.forEach((email) => {
        if (email && typeof email === 'string') {
          queryParams.push(`recorded_by[]=${encodeURIComponent(email)}`);
        }
      });
    }

    if (teams && Array.isArray(teams) && teams.length > 0) {
      teams.forEach((team) => {
        if (team && typeof team === 'string') {
          queryParams.push(`teams[]=${encodeURIComponent(team)}`);
        }
      });
    }

    // Build final path with query string
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const path = `/meetings${queryString}`;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
