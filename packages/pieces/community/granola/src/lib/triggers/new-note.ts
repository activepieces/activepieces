import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { granolaAuth } from '../../';
import {
  granolaApiCall,
  flattenNote,
  GranolaListResponse,
} from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof granolaAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const queryParams: Record<string, string> = { page_size: '30' };
    if (lastFetchEpochMS > 0) {
      queryParams['created_after'] = new Date(lastFetchEpochMS).toISOString();
    }
    const response = await granolaApiCall<GranolaListResponse>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/notes',
      queryParams,
    });

    return response.body.notes.map((note) => ({
      epochMilliSeconds: new Date(note.created_at).getTime(),
      data: flattenNote(note),
    }));
  },
};

export const newNoteTrigger = createTrigger({
  auth: granolaAuth,
  name: 'new_note',
  displayName: 'New Note',
  description: 'Triggers when a new meeting note is created in Granola.',
  props: {},
  sampleData: {
    id: 'not_1d3tmYTlCICgjy',
    title: 'Quarterly budget review',
    owner_name: 'Jane Doe',
    owner_email: 'jane@example.com',
    created_at: '2026-03-27T10:00:00Z',
    updated_at: '2026-03-27T10:30:00Z',
    calendar_event_title: 'Quarterly budget review',
    calendar_organiser: 'jane@example.com',
    calendar_event_id: 'cal_abc123',
    scheduled_start_time: '2026-03-27T10:00:00Z',
    scheduled_end_time: '2026-03-27T11:00:00Z',
    attendees: 'Jane Doe, John Smith',
    folders: 'Finance',
    summary_text: 'Discussed Q1 budget allocation and projections.',
    summary_markdown: null,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
