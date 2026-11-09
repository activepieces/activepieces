import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient, FirefliesRecord } from '../common/client';
import { firefliesInput } from '../common/props';
import { firefliesQueries, GraphqlVariableSpec } from '../common/queries';
import { firefliesOutputSchemas } from '../output-schemas';

export const findMeetingByQueryAction = createAction({
  auth: firefliesAiAuth,
  name: 'find_meeting_by_query',
  classification: 'SEARCH',
  displayName: 'Find Meeting by Call Details',
  description: 'Searches meetings based on provided parameters. Returns up to 1,000 meetings; narrow the filters if more match.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Fireflies meetings by title, host email, participant email and/or the 24 hours from a given date-time and returns every match with full details, up to 1,000 meetings. Fails when more than that match. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.findMeetingByQuery,
  props: {
    title: Property.ShortText({
      displayName: 'Meeting Title',
      description: 'Finds meetings whose title contains this text.',
      required: false,
    }),
    hostEmail: Property.ShortText({
      displayName: 'Host Email',
      description: 'Filter meetings by host email.',
      required: false,
    }),
    participantEmail: Property.ShortText({
      displayName: 'Participant Email',
      description: 'Filter meetings by participant email',
      required: false,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'Finds meetings in the 24 hours starting at this date and time. Pick the date in the date picker to get that day in your time zone.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const variables = buildFilters({
      title: propsValue.title,
      hostEmail: propsValue.hostEmail,
      participantEmail: propsValue.participantEmail,
      date: propsValue.date,
    });
    const title = firefliesInput.optionalText(propsValue.title);
    const query = firefliesQueries.searchTranscripts({
      variables: [...variables.specs, ...PAGE_SPECS],
      scope: title === undefined ? undefined : 'title',
      fields: 'full',
    });
    const meetings: FirefliesRecord[] = [];
    const startedAt = Date.now();
    for (let page = 0; page < MAX_PAGES; page++) {
      const remaining = RUN_DEADLINE_MS - (Date.now() - startedAt);
      if (remaining <= 0) {
        throw deadlineError({ pages: page });
      }
      const data = await firefliesClient
        .graphql({
          apiKey: auth,
          query,
          variables: { ...variables.values, limit: PAGE_SIZE, skip: page * PAGE_SIZE },
          operation: `search meetings (page ${page + 1})`,
          timeoutMs: Math.min(REQUEST_TIMEOUT_MS, remaining),
        })
        .catch((error: unknown) => {
          if (Date.now() - startedAt >= RUN_DEADLINE_MS) {
            throw deadlineError({ pages: page });
          }
          throw error;
        });
      const transcripts = firefliesClient.recordList(data['transcripts']);
      meetings.push(...transcripts);
      if (transcripts.length < PAGE_SIZE) {
        return { found: meetings.length > 0, meetings };
      }
    }
    throw new Error(
      `At least ${MAX_PAGES * PAGE_SIZE} meetings match these filters, which is more than this action returns. Narrow the search with a title, host, participant or date.`,
    );
  },
});

function buildFilters({ title, hostEmail, participantEmail, date }: { title: unknown; hostEmail: unknown; participantEmail: unknown; date: unknown }): { specs: GraphqlVariableSpec[]; values: Record<string, unknown> } {
  const specs: GraphqlVariableSpec[] = [];
  const values: Record<string, unknown> = {};
  const keyword = firefliesInput.optionalText(title);
  if (keyword !== undefined) {
    specs.push({ variable: 'keyword', argument: 'keyword', type: 'String!' });
    values['keyword'] = keyword;
  }
  const host = firefliesInput.optionalText(hostEmail);
  if (host !== undefined) {
    specs.push({ variable: 'hostEmail', argument: 'host_email', type: 'String!' });
    values['hostEmail'] = host;
  }
  const participant = firefliesInput.optionalText(participantEmail);
  if (host !== undefined && participant !== undefined) {
    throw new Error('Fireflies does not combine Host Email with Participant Email in one search. Fill in only one of them.');
  }
  if (participant !== undefined) {
    specs.push({ variable: 'participants', argument: 'participants', type: '[String!]' });
    values['participants'] = [participant];
  }
  const day = dayWindow(date);
  if (day !== undefined) {
    specs.push({ variable: 'fromDate', argument: 'fromDate', type: 'DateTime!' }, { variable: 'toDate', argument: 'toDate', type: 'DateTime!' });
    values['fromDate'] = day.fromDate;
    values['toDate'] = day.toDate;
  }
  return { specs, values };
}

function dayWindow(value: unknown): { fromDate: string; toDate: string } | undefined {
  const text = firefliesInput.optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const start = new Date(text).getTime();
  if (Number.isNaN(start)) {
    throw new Error(`Date must be a valid date (got "${text.slice(0, 50)}").`);
  }
  return { fromDate: new Date(start).toISOString(), toDate: new Date(start + DAY_MS - 1).toISOString() };
}

function deadlineError({ pages }: { pages: number }): Error {
  return new Error(
    `Searching meetings took longer than ${RUN_DEADLINE_MS / 1000} s after ${pages} page(s), so no partial result is returned. Narrow your filters with a title, host, participant or date.`,
  );
}

const PAGE_SIZE = 50;

const MAX_PAGES = 20;

const RUN_DEADLINE_MS = 240_000;

const REQUEST_TIMEOUT_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;

const PAGE_SPECS: GraphqlVariableSpec[] = [
  { variable: 'limit', argument: 'limit', type: 'Int!' },
  { variable: 'skip', argument: 'skip', type: 'Int!' },
];
