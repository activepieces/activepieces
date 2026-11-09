import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, SEARCH_SCOPES, YES_NO_OPTIONS } from '../../common/props';
import { firefliesQueries, GraphqlVariableSpec } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const searchMeetingsAction = createAction({
  auth: firefliesAiAuth,
  name: 'search_meetings',
  classification: 'SEARCH',
  displayName: 'Find Meetings',
  description: 'Searches Fireflies meetings and returns one page of short results.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Fireflies meetings by keyword, date range, organizer, participant, owner or channel and returns one page of short rows (ID, title, date, short summary), newest meeting date first. Use at most one owner filter (mine or user_id), and do not combine it with organizers or participants. Use the IDs with Get Meeting, Get Meeting Summary or Get Meeting Transcript. Page with skip/next_skip. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.searchMeetings,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Text to look for (max 255 characters). Where to look is set by Search In.',
      required: false,
    }),
    scope: Property.StaticDropdown<string>({
      displayName: 'Search In',
      description: 'Where the keyword is matched: the meeting title (default), the spoken sentences, or both.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Title', value: 'title' },
          { label: 'Spoken sentences', value: 'sentences' },
          { label: 'Title and sentences', value: 'all' },
        ],
      },
    }),
    from_date: Property.ShortText({
      displayName: 'From Date',
      description: 'Only meetings on or after this ISO 8601 date or date-time, for example 2026-03-01 or 2026-03-01T09:00:00Z. Times without an offset are UTC.',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'To Date',
      description: 'Only meetings on or before this ISO 8601 date or date-time. A date alone includes the whole day (UTC).',
      required: false,
    }),
    organizers: Property.Array({
      displayName: 'Organizer Emails',
      description: 'Only meetings organized by any of these email addresses.',
      required: false,
    }),
    participants: Property.Array({
      displayName: 'Participant Emails',
      description: 'Only meetings that any of these email addresses attended.',
      required: false,
    }),
    mine: Property.StaticDropdown<string>({
      displayName: 'Only My Meetings',
      description: 'Choose "Yes" to return only meetings owned by the API key owner.',
      required: false,
      options: { disabled: false, options: YES_NO_OPTIONS },
    }),
    user_id: Property.ShortText({
      displayName: 'Owner User ID',
      description: 'Only meetings owned by this Fireflies user ID (from Get Current User or List Users).',
      required: false,
    }),
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Only meetings in this channel (from List Channels).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Meetings per page, 1 to 50. Default 20.',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'How many matching meetings to skip, for paging. Default 0.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const request = buildSearch({
      keyword: propsValue.keyword,
      scope: propsValue.scope,
      fromDate: propsValue.from_date,
      toDate: propsValue.to_date,
      organizers: propsValue.organizers,
      participants: propsValue.participants,
      mine: propsValue.mine,
      userId: propsValue.user_id,
      channelId: propsValue.channel_id,
      limit: propsValue.limit,
      skip: propsValue.skip,
    });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.searchTranscripts({ variables: request.specs, scope: request.scope, fields: 'slim' }),
      variables: request.values,
      operation: 'search meetings',
    });
    const meetings = firefliesClient.recordList(data['transcripts']);
    const hasMore = meetings.length === request.limit;
    return {
      meetings,
      count: meetings.length,
      limit: request.limit,
      skip: request.skip,
      next_skip: hasMore ? request.skip + meetings.length : null,
      has_more: hasMore,
    };
  },
});

function buildSearch(params: SearchParams): SearchRequest {
  const keyword = firefliesInput.optionalText(params.keyword);
  if (keyword !== undefined && keyword.length > 255) {
    throw new Error(`Keyword must be at most 255 characters (got ${keyword.length}).`);
  }
  const scope = firefliesInput.oneOf({ value: params.scope, label: 'Search In', allowed: SEARCH_SCOPES });
  if (scope !== undefined && keyword === undefined) {
    throw new Error('Search In only applies together with a Keyword.');
  }
  const from = firefliesInput.strictIsoDate({ value: params.fromDate, label: 'From Date', dateOnlyAs: 'start' });
  const to = firefliesInput.strictIsoDate({ value: params.toDate, label: 'To Date', dateOnlyAs: 'end' });
  if (from !== undefined && to !== undefined && from.epochMs > to.epochMs) {
    throw new Error('From Date must be before To Date.');
  }
  const organizers = firefliesInput.emailList({ value: params.organizers, label: 'Organizer Emails', max: 50 });
  const participants = firefliesInput.emailList({ value: params.participants, label: 'Participant Emails', max: 50 });
  const mine = firefliesInput.yesNo({ value: params.mine, label: 'Only My Meetings' });
  const userId = firefliesInput.optionalText(params.userId);
  const channelId = firefliesInput.optionalText(params.channelId);
  if (mine === true && userId !== undefined) {
    throw new Error('Use either Only My Meetings or Owner User ID, not both: Fireflies accepts one owner filter per search.');
  }
  if ((mine === true || userId !== undefined) && (organizers.length > 0 || participants.length > 0)) {
    throw new Error('Fireflies does not combine an owner filter (Only My Meetings or Owner User ID) with Organizer Emails or Participant Emails. Use one or the other.');
  }
  const limit = firefliesInput.optionalInteger({ value: params.limit, label: 'Limit', min: 1, max: 50 }) ?? DEFAULT_LIMIT;
  const skip = firefliesInput.optionalInteger({ value: params.skip, label: 'Skip', min: 0, max: 1_000_000 }) ?? 0;
  const entries: Array<[GraphqlVariableSpec, unknown]> = [];
  if (keyword !== undefined) {
    entries.push([{ variable: 'keyword', argument: 'keyword', type: 'String!' }, keyword]);
  }
  if (from !== undefined) {
    entries.push([{ variable: 'fromDate', argument: 'fromDate', type: 'DateTime!' }, from.iso]);
  }
  if (to !== undefined) {
    entries.push([{ variable: 'toDate', argument: 'toDate', type: 'DateTime!' }, to.iso]);
  }
  if (organizers.length > 0) {
    entries.push([{ variable: 'organizers', argument: 'organizers', type: '[String!]' }, organizers]);
  }
  if (participants.length > 0) {
    entries.push([{ variable: 'participants', argument: 'participants', type: '[String!]' }, participants]);
  }
  if (mine !== undefined) {
    entries.push([{ variable: 'mine', argument: 'mine', type: 'Boolean!' }, mine]);
  }
  if (userId !== undefined) {
    entries.push([{ variable: 'userId', argument: 'user_id', type: 'String!' }, userId]);
  }
  if (channelId !== undefined) {
    entries.push([{ variable: 'channelId', argument: 'channel_id', type: 'String!' }, channelId]);
  }
  entries.push([{ variable: 'limit', argument: 'limit', type: 'Int!' }, limit], [{ variable: 'skip', argument: 'skip', type: 'Int!' }, skip]);
  return {
    specs: entries.map(([spec]) => spec),
    values: Object.fromEntries(entries.map(([spec, value]) => [spec.variable, value])),
    scope: keyword === undefined ? undefined : scope,
    limit,
    skip,
  };
}

export const searchMeetingsInternals = { buildSearch };

const DEFAULT_LIMIT = 20;

type SearchParams = {
  keyword: unknown;
  scope: unknown;
  fromDate: unknown;
  toDate: unknown;
  organizers: unknown;
  participants: unknown;
  mine: unknown;
  userId: unknown;
  channelId: unknown;
  limit: unknown;
  skip: unknown;
};

type SearchRequest = {
  specs: GraphqlVariableSpec[];
  values: Record<string, unknown>;
  scope: string | undefined;
  limit: number;
  skip: number;
};
