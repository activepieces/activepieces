import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { leexiOutputFields, MAX_TRIGGER_PAGES } from '../common/constants';
import { LeexiCall, LeexiListResponse } from '../common/types';

const polling: Polling<AppConnectionValueForAuthProperty<typeof leexiAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTestMode = lastFetchEpochMS === 0;
    const calls: LeexiCall[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await leexiApi.request<LeexiListResponse<LeexiCall>>({
        auth,
        method: HttpMethod.GET,
        path: ['calls'],
        query: {
          page,
          items: isTestMode ? 5 : 100,
          order: isTestMode ? 'created_at desc' : 'created_at asc',
          date_filter: 'created_at',
          from: isTestMode ? undefined : dayjs(lastFetchEpochMS).toISOString(),
        },
      });

      calls.push(...(response.data ?? []));

      if (isTestMode) {
        break;
      }

      totalPages = response.pagination?.pages ?? 0;
      page++;
    } while (page <= totalPages && page <= MAX_TRIGGER_PAGES);

    return calls.map((call) => ({
      epochMilliSeconds: dayjs(call.created_at).valueOf(),
      data: call,
    }));
  },
};

export const newCallCreatedTrigger = createTrigger({
  name: 'new-call-created',
  classification: 'READ',
  auth: leexiAuth,
  displayName: 'New Call Created',
  description: 'Triggers when a new call is created.',
  aiMetadata: {
    description:
      'Fires when a new call (recording/transcription session) appears in the Leexi account. Polls the calls list on an interval and emits one event per newly created call.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: {
    fields: leexiOutputFields.callDetail.filter((f) => f.key !== 'simple_transcript'),
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    locale: 'en-US',
    duration: 395,
    direction: 'outbound',
    is_video: true,
    visible: true,
    title: 'Product demo with Acme',
    description: null,
    custom_fields: {},
    created_at: '2026-11-03T06:41:17.956Z',
    updated_at: '2026-11-03T06:41:20.714Z',
    performed_at: '2026-11-03T06:41:16.738Z',
    leexi_url: 'https://app.leexi.ai/calls/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    video_archived_at: null,
    audio_archived_at: null,
    transcript_archived_at: null,
    completions_archived_at: null,
    source: 'leexi',
    source_id: 'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f',
    recording_url: 'https://example-bucket.s3.amazonaws.com/calls/a1b2c3d4/recording.mp4?X-Amz-Expires=3600',
    transcript_url: 'https://example-bucket.s3.amazonaws.com/calls/a1b2c3d4/transcript.json?X-Amz-Expires=3600',
    summary: '# Title: Product demo with Acme\n\n## Context\nWalkthrough of the main features and next steps.',
    conversation_type: {
      uuid: '079af83f-467c-4f65-8320-401c74978dff',
      slug: 'generic_internal',
      active: true,
    },
    deal: null,
    meeting_event: null,
    feedbacks: [],
    owner: {
      uuid: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      active: true,
    },
    participating_users: [
      {
        uuid: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        active: true,
      },
    ],
    customer_phone_numbers: [],
    customer_email_addresses: [],
    customers: [],
    speakers: [
      {
        uuid: 'd4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a',
        index: 0,
        duration: 352.422,
        longest_monologue: 394.622,
        name: 'Speaker 1',
        is_user: false,
        phone_number: null,
        email_address: null,
      },
    ],
    prompts: [
      {
        uuid: 'e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b',
        title: 'follow-up tasks',
        category: 'follow_up_tasks',
        completions: ['Send the pricing proposal to Acme'],
      },
    ],
    chapters: [
      {
        uuid: 'f6a7b8c9-d0e1-4f2a-9b3c-4d5e6f7a8b9c',
        index: 0,
        title: 'Chapter 1: Introduction',
        text: 'Jane introduces the agenda for the demo.',
        start_time: 0,
      },
    ],
    scorecards: [],
    tags: [],
    tasks: [
      {
        uuid: 'a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c0d',
        active: true,
        subject: 'Send the pricing proposal to Acme',
        description: null,
        status: 'not_started',
        owner: null,
        done: false,
        speaker: null,
        last_editor: null,
        created_at: '2026-11-03T06:41:19.317Z',
        updated_at: '2026-11-03T06:41:19.317Z',
      },
    ],
    simple_transcript: '',
  },
});

export const newCallCreatedPolling: Polling<AppConnectionValueForAuthProperty<typeof leexiAuth>, Record<string, never>> = polling;
