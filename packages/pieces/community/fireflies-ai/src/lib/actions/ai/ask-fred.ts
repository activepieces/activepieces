import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput } from '../../common/props';
import { firefliesQueries, GraphqlVariableSpec } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const askFredAction = createAction({
  auth: firefliesAiAuth,
  name: 'ask_fred',
  classification: 'WRITE',
  displayName: 'Ask Fred',
  description: 'Asks Fireflies AI (AskFred) a question about one meeting or a set of meetings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Asks Fireflies\' own AI (AskFred) a question about one meeting (Meeting ID) or about meetings matched by date range, organizers, participants, channels or meeting IDs (default: the last 30 days). Spends Fireflies AI credits and saves a new AskFred thread each call. Prefer Get Meeting Summary or Get Meeting Transcript when you can answer from the text yourself.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.askFred,
  props: {
    query: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask, up to 2000 characters.',
      required: true,
    }),
    meeting_id: Property.ShortText({
      displayName: 'Meeting ID',
      description: 'Ask about this one meeting. Leave empty to use the filters below instead.',
      required: false,
    }),
    from_date: Property.ShortText({
      displayName: 'From Date',
      description: 'Only meetings on or after this ISO 8601 date or date-time (at most 1 year back).',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'To Date',
      description: 'Only meetings on or before this ISO 8601 date or date-time.',
      required: false,
    }),
    organizers: Property.Array({
      displayName: 'Organizer Emails',
      required: false,
    }),
    participants: Property.Array({
      displayName: 'Participant Emails',
      required: false,
    }),
    channel_ids: Property.Array({
      displayName: 'Channel IDs',
      required: false,
    }),
    meeting_ids: Property.Array({
      displayName: 'Meeting IDs',
      description: 'Only these meetings.',
      required: false,
    }),
    response_language: Property.ShortText({
      displayName: 'Answer Language',
      description: 'Optional language code for the answer, for example "en" or "es".',
      required: false,
    }),
    format_mode: Property.StaticDropdown<string>({
      displayName: 'Answer Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        disabled: false,
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'Plain text', value: 'plaintext' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const request = buildAskFred({
      query: propsValue.query,
      meetingId: propsValue.meeting_id,
      fromDate: propsValue.from_date,
      toDate: propsValue.to_date,
      organizers: propsValue.organizers,
      participants: propsValue.participants,
      channelIds: propsValue.channel_ids,
      meetingIds: propsValue.meeting_ids,
      responseLanguage: propsValue.response_language,
      formatMode: propsValue.format_mode,
    });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.createAskFredThread({ inputFields: request.inputFields, filterFields: request.filterFields, variables: [...request.inputFields, ...request.filterFields] }),
      variables: request.values,
      operation: 'ask Fred',
    });
    const thread = firefliesClient.requireEntity({ data, key: 'createAskFredThread', notFound: 'Fireflies returned no AskFred answer.' });
    if (!firefliesClient.isRecord(thread['message'])) {
      throw new Error('Fireflies returned an AskFred thread with no message.');
    }
    return thread['message'];
  },
});

function buildAskFred(params: AskFredParams): AskFredRequest {
  const query = firefliesInput.requireText({ value: params.query, label: 'Question', maxLength: 2000 });
  const meetingId = firefliesInput.optionalText(params.meetingId);
  const from = firefliesInput.strictIsoDate({ value: params.fromDate, label: 'From Date', dateOnlyAs: 'start' });
  const to = firefliesInput.strictIsoDate({ value: params.toDate, label: 'To Date', dateOnlyAs: 'end' });
  if (from !== undefined && to !== undefined && from.epochMs > to.epochMs) {
    throw new Error('From Date must be before To Date.');
  }
  const organizers = firefliesInput.emailList({ value: params.organizers, label: 'Organizer Emails', max: 50 });
  const participants = firefliesInput.emailList({ value: params.participants, label: 'Participant Emails', max: 50 });
  const channelIds = firefliesInput.textList({ value: params.channelIds, label: 'Channel IDs', max: 50 });
  const meetingIds = firefliesInput.textList({ value: params.meetingIds, label: 'Meeting IDs', max: 50 });
  const filterEntries: Array<[GraphqlVariableSpec, unknown]> = [];
  if (from !== undefined) {
    filterEntries.push([{ variable: 'startTime', argument: 'start_time', type: 'String!' }, from.iso]);
  }
  if (to !== undefined) {
    filterEntries.push([{ variable: 'endTime', argument: 'end_time', type: 'String!' }, to.iso]);
  }
  if (organizers.length > 0) {
    filterEntries.push([{ variable: 'organizers', argument: 'organizers', type: '[String!]' }, organizers]);
  }
  if (participants.length > 0) {
    filterEntries.push([{ variable: 'participants', argument: 'participants', type: '[String!]' }, participants]);
  }
  if (channelIds.length > 0) {
    filterEntries.push([{ variable: 'channelIds', argument: 'channel_ids', type: '[String!]' }, channelIds]);
  }
  if (meetingIds.length > 0) {
    filterEntries.push([{ variable: 'transcriptIds', argument: 'transcript_ids', type: '[String!]' }, meetingIds]);
  }
  if (meetingId !== undefined && filterEntries.length > 0) {
    throw new Error('Use either Meeting ID or the filters (dates, organizers, participants, channels, meeting IDs), not both.');
  }
  const inputEntries: Array<[GraphqlVariableSpec, unknown]> = [[{ variable: 'query', argument: 'query', type: 'String!' }, query]];
  if (meetingId !== undefined) {
    inputEntries.push([{ variable: 'transcriptId', argument: 'transcript_id', type: 'String!' }, meetingId]);
  }
  const language = firefliesInput.optionalText(params.responseLanguage);
  if (language !== undefined) {
    inputEntries.push([{ variable: 'responseLanguage', argument: 'response_language', type: 'String!' }, language]);
  }
  const formatMode = firefliesInput.oneOf({ value: params.formatMode, label: 'Answer Format', allowed: FORMAT_MODES }) ?? 'markdown';
  inputEntries.push([{ variable: 'formatMode', argument: 'format_mode', type: 'FormatMode!' }, formatMode]);
  return {
    inputFields: inputEntries.map(([spec]) => spec),
    filterFields: filterEntries.map(([spec]) => spec),
    values: Object.fromEntries([...inputEntries, ...filterEntries].map(([spec, value]) => [spec.variable, value])),
  };
}

export const askFredInternals = { buildAskFred };

const FORMAT_MODES = ['markdown', 'plaintext'] as const;

type AskFredParams = {
  query: unknown;
  meetingId: unknown;
  fromDate: unknown;
  toDate: unknown;
  organizers: unknown;
  participants: unknown;
  channelIds: unknown;
  meetingIds: unknown;
  responseLanguage: unknown;
  formatMode: unknown;
};

type AskFredRequest = {
  inputFields: GraphqlVariableSpec[];
  filterFields: GraphqlVariableSpec[];
  values: Record<string, unknown>;
};
