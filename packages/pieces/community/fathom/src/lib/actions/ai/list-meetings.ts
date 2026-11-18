import { AppConnectionType, createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../../common/auth';
import { fathomClient } from '../../common/client';
import { fathomInputs } from '../../common/props';
import { fathomOutputSchemas } from '../../output-schemas';

export const aiListMeetings = createAction({
  name: 'fathom_list_meetings',
  classification: 'SEARCH',
  displayName: 'List Meetings (AI)',
  description: 'Returns one page of Fathom meetings with optional filters. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of Fathom meetings, newest first, with recording IDs, links, invitees and recorder, optionally filtered by date window, recorder email, team, company domain, internal/external or meeting type, and optionally embedding action items, highlights, CRM matches, summary or transcript. Use it to find a recording ID before getting its summary or transcript; pass next_cursor to continue. Summary and transcript flags work only on API-key connections (use the Get Recording actions under OAuth). Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    created_after: Property.DateTime({ displayName: 'Created After', description: 'Only meetings created after this ISO 8601 date-time.', required: false }),
    created_before: Property.DateTime({ displayName: 'Created Before', description: 'Only meetings created before this ISO 8601 date-time.', required: false }),
    recorded_by: Property.Array({ displayName: 'Recorded By', description: 'Emails of the Fathom users who recorded the meetings.', required: false }),
    teams: Property.Array({ displayName: 'Teams', description: 'Exact team names (see Find Team).', required: false }),
    calendar_invitees_domains: Property.Array({ displayName: 'Company Domains', description: 'Company domains of the invitees, exact match (e.g. acme.com).', required: false }),
    calendar_invitees_domains_type: Property.StaticDropdown({
      displayName: 'Internal or External',
      description: 'Only internal meetings, or only meetings with at least one external invitee.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Only Internal', value: 'only_internal' },
          { label: 'One or More External', value: 'one_or_more_external' },
        ],
      },
    }),
    meeting_type: Property.ShortText({ displayName: 'Meeting Type', description: 'Exact meeting type name from List Meeting Types. An unknown name returns no meetings.', required: false }),
    include_action_items: Property.Checkbox({ displayName: 'Include Action Items', required: false, defaultValue: false }),
    include_highlights: Property.Checkbox({ displayName: 'Include Highlights', required: false, defaultValue: false }),
    include_crm_matches: Property.Checkbox({ displayName: 'Include CRM Matches', required: false, defaultValue: false }),
    include_summary: Property.Checkbox({ displayName: 'Include Summary', description: 'API key connections only.', required: false, defaultValue: false }),
    include_transcript: Property.Checkbox({ displayName: 'Include Transcript', description: 'API key connections only.', required: false, defaultValue: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from the previous call.', required: false }),
  },
  outputSchema: fathomOutputSchemas.meetingsPage,
  async run({ auth, propsValue }) {
    if ((propsValue.include_summary === true || propsValue.include_transcript === true) && auth.type !== AppConnectionType.SECRET_TEXT) {
      throw new Error(
        'Fathom does not return summaries or transcripts in List Meetings for OAuth connections. Set include_summary and include_transcript to false and call Get Recording Summary (AI) or Get Recording Transcript (AI) with the recording_id instead.'
      );
    }
    const domainsType = propsValue.calendar_invitees_domains_type;
    const page = await fathomClient.listPage({
      auth,
      path: 'meetings',
      query: {
        created_after: fathomInputs.optionalTimestamp({ value: propsValue.created_after, label: 'Created After' }),
        created_before: fathomInputs.optionalTimestamp({ value: propsValue.created_before, label: 'Created Before' }),
        recorded_by: fathomInputs.stringList({ value: propsValue.recorded_by }),
        teams: fathomInputs.stringList({ value: propsValue.teams }),
        calendar_invitees_domains: fathomInputs.stringList({ value: propsValue.calendar_invitees_domains }),
        calendar_invitees_domains_type: domainsType === 'only_internal' || domainsType === 'one_or_more_external' ? domainsType : undefined,
        meeting_type: fathomInputs.optionalText({ value: propsValue.meeting_type }),
        include_action_items: propsValue.include_action_items === true || undefined,
        include_highlights: propsValue.include_highlights === true || undefined,
        include_crm_matches: propsValue.include_crm_matches === true || undefined,
        include_summary: propsValue.include_summary === true || undefined,
        include_transcript: propsValue.include_transcript === true || undefined,
        cursor: fathomInputs.optionalText({ value: propsValue.cursor }),
      },
    });
    return { items: page.items, next_cursor: page.next_cursor, has_more: page.next_cursor !== null };
  },
});
