import { createAction, Property } from '@activepieces/pieces-framework';
import { callsyncAuth } from '../auth';
import { callsyncListAll, flatten } from '../common/client';

export const findCalls = createAction({
  auth: callsyncAuth,
  name: 'find_calls',
  classification: 'SEARCH',
  displayName: 'Find Calls',
  description: 'Finds calls synced from your team\'s phones, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'List business calls from CallSync, newest first, optionally filtered by direction or a search term that matches phone, caller name, notes, team member and AI summary. Use Get Call AI Analysis for the full transcript of one call. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches phone number, caller name, notes, team member and AI summary.',
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: false,
      options: {
        options: [
          { label: 'Incoming', value: 'incoming' },
          { label: 'Outgoing', value: 'outgoing' },
          { label: 'Missed', value: 'missed' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Blocked', value: 'blocked' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most calls to return.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { search, direction, limit } = context.propsValue;
    const calls = await callsyncListAll({
      apiKey: context.auth.secret_text,
      path: 'calls',
      query: { search: search ?? undefined, direction: direction ?? undefined },
      limit: limit ?? 25,
    });
    return calls.map((call) => flatten(call));
  },
});
