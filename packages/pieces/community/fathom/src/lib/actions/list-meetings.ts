import { AppConnectionType, createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { FathomApiError } from '../common/client';
import { fathomInputs } from '../common/props';
import { fathomSdk } from '../common/sdk';
import { fathomOutputSchemas } from '../output-schemas';

export const listMeetings = createAction({
  name: 'listMeetings',
  classification: 'SEARCH',
  displayName: 'List Meetings',
  description: 'List meetings with optional filters. Follows every page unless you set Max Pages.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists Fathom meetings with filters (invitee domains, internal/external, recorder, team, created window) and optional embedded transcript, summary, action items and CRM matches, following pages to the end unless a page limit is set. Agents should prefer List Meetings (AI), which returns one page at a time. Transcript and summary flags need an API-key connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    calendar_invitees: Property.Array({
      displayName: 'Calendar Invitees',
      description: 'Email addresses of calendar invitees to filter by. Fathom no longer documents this filter and may ignore it; prefer Calendar Invitees Domains or Recorded By.',
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
      description: 'Include the transcript for each meeting. API key connections only; with OAuth use Get Recording Transcript.',
      required: false,
      defaultValue: false,
    }),
    include_summary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary for each meeting. API key connections only; with OAuth use Get Recording Summary.',
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
    max_pages: Property.Number({
      displayName: 'Max Pages',
      description: 'Stop after this many pages of meetings. Leave empty to fetch every page (each page holds about 10 meetings).',
      required: false,
    }),
  },
  outputSchema: fathomOutputSchemas.legacyMeetingPages,
  async run({ auth, propsValue }) {
    const maxPages = parseMaxPages({ value: propsValue.max_pages });
    const wantsHeavyContent = propsValue.include_summary === true || propsValue.include_transcript === true;
    if (wantsHeavyContent && auth.type !== AppConnectionType.SECRET_TEXT) {
      throw new Error(
        'Fathom does not return summaries or transcripts in List Meetings for OAuth connections. Turn off Include Summary and Include Transcript and use Get Recording Summary or Get Recording Transcript, or connect with an API key.'
      );
    }
    const { sdk, requireResult } = fathomSdk.create({ auth });
    const calendarInvitees = fathomInputs.stringList({ value: propsValue.calendar_invitees });
    const calendarInviteesDomains = fathomInputs.stringList({ value: propsValue.calendar_invitees_domains });
    const recordedBy = fathomInputs.stringList({ value: propsValue.recorded_by });
    const teams = fathomInputs.stringList({ value: propsValue.teams });
    const domainsType = propsValue.calendar_invitees_domains_type;
    const createdAfter = fathomInputs.optionalText({ value: propsValue.created_after });
    const createdBefore = fathomInputs.optionalText({ value: propsValue.created_before });
    const cursor = fathomInputs.optionalText({ value: propsValue.cursor });

    const iterator = await sdk.listMeetings({
      ...(calendarInvitees ? { calendarInvitees } : {}),
      ...(calendarInviteesDomains ? { calendarInviteesDomains } : {}),
      ...(domainsType === 'only_internal' || domainsType === 'one_or_more_external' ? { calendarInviteesDomainsType: domainsType } : {}),
      ...(recordedBy ? { recordedBy } : {}),
      ...(teams ? { teams } : {}),
      ...(createdAfter ? { createdAfter } : {}),
      ...(createdBefore ? { createdBefore } : {}),
      ...(propsValue.include_transcript ? { includeTranscript: true } : {}),
      ...(propsValue.include_summary ? { includeSummary: true } : {}),
      ...(propsValue.include_action_items ? { includeActionItems: true } : {}),
      ...(propsValue.include_crm_matches ? { includeCrmMatches: true } : {}),
      ...(cursor ? { cursor } : {}),
    });

    const pages = [];
    try {
      for await (const page of iterator) {
        pages.push(requireResult({ value: page, operation: 'List Meetings' }));
        if (maxPages !== undefined && pages.length >= maxPages) {
          break;
        }
      }
    } catch (error) {
      if (error instanceof FathomApiError && pages.length > 0) {
        throw new FathomApiError({
          status: error.status,
          responseBody: error.responseBody,
          message: `${error.message} ${pages.length} page(s) were read before the failure; set Max Pages to fetch fewer pages per run.`,
        });
      }
      throw error;
    }
    return pages;
  },
});

function parseMaxPages({ value }: { value: unknown }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const pages = Number(value);
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error('Max Pages must be a whole number of 1 or more, or empty to fetch every page.');
  }
  return pages;
}
