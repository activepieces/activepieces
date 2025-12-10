import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';
import { ListMeetingsRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const listMeetings = createAction({
  name: 'listMeetings',
  displayName: 'List Meetings',
  description: 'List meetings with optional filtering and pagination',
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
    const fathom = new Fathom({
      security: { apiKeyAuth: auth.secret_text },
    });

    const request: Partial<ListMeetingsRequest> = {};

    if (propsValue.calendar_invitees && Array.isArray(propsValue.calendar_invitees)) {
      request.calendarInvitees = propsValue.calendar_invitees as string[];
    }

    if (propsValue.calendar_invitees_domains && Array.isArray(propsValue.calendar_invitees_domains)) {
      request.calendarInviteesDomains = propsValue.calendar_invitees_domains as string[];
    }

    if (propsValue.calendar_invitees_domains_type && propsValue.calendar_invitees_domains_type !== 'all') {
      request.calendarInviteesDomainsType = propsValue.calendar_invitees_domains_type as 'only_internal' | 'one_or_more_external';
    }

    if (propsValue.recorded_by && Array.isArray(propsValue.recorded_by)) {
      request.recordedBy = propsValue.recorded_by as string[];
    }

    if (propsValue.teams && Array.isArray(propsValue.teams)) {
      request.teams = propsValue.teams as string[];
    }

    if (propsValue.created_after) {
      request.createdAfter = propsValue.created_after;
    }

    if (propsValue.created_before) {
      request.createdBefore = propsValue.created_before;
    }

    if (propsValue.include_transcript) {
      request.includeTranscript = true;
    }

    if (propsValue.include_summary) {
      request.includeSummary = true;
    }

    if (propsValue.include_action_items) {
      request.includeActionItems = true;
    }

    if (propsValue.include_crm_matches) {
      request.includeCrmMatches = true;
    }

    if (propsValue.cursor) {
      request.cursor = propsValue.cursor;
    }

    const response = await fathom.listMeetings(request);

    const meetings = [];
    for await (const meeting of response) {
      meetings.push(meeting);
    }

    return meetings;
  },
});
