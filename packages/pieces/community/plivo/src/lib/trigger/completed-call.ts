import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';
import { callPlivoApi } from '../common';

const PAGE_SIZE = 20;
const MAX_PAGES = 50;
// Plivo rejects an end_time span wider than a month, and without any span it answers from
// a narrow default window that can hide recent calls entirely.
const LOOKBACK_LIMIT_MS = 27 * 24 * 60 * 60 * 1000;
// The filter is read in the account's timezone while the watermark is epoch based, so the
// request reaches back a day further than needed and the exact cut is left to the
// comparison below. Asking for slightly too much cannot drop a call; asking for slightly
// too little can.
const SAFETY_MARGIN_MS = 24 * 60 * 60 * 1000;

const plivoTimestamp = (epochMilliSeconds: number): string => {
  const at = new Date(epochMilliSeconds);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(
    at.getUTCDate()
  )} ${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}:${pad(at.getUTCSeconds())}`;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof plivoAuth>, Record<string, unknown>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTest = lastFetchEpochMS === 0;
    const authId = auth.username;
    const limit = isTest ? 1 : PAGE_SIZE;

    const earliest = Date.now() - LOOKBACK_LIMIT_MS;
    const since = isTest
      ? earliest
      : Math.max(earliest, lastFetchEpochMS - SAFETY_MARGIN_MS);

    const items: { epochMilliSeconds: number; data: PlivoCall }[] = [];
    let offset = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await callPlivoApi<PlivoCallListResponse>(
        HttpMethod.GET,
        'Call/',
        { auth_id: authId, auth_token: auth.password },
        undefined,
        {
          call_direction: 'inbound',
          limit: String(limit),
          offset: String(offset),
          end_time__gt: plivoTimestamp(since),
        }
      );

      const calls = response.body.objects ?? [];
      for (const call of calls) {
        const timestamp = call.end_time || call.initiation_time || '';
        // An unparseable timestamp yields NaN, and NaN travels into the stored watermark
        // as null, after which every later poll fails with a missing watermark until the
        // trigger is disabled and enabled again.
        const parsed = timestamp ? new Date(timestamp).getTime() : 0;
        items.push({
          epochMilliSeconds: Number.isNaN(parsed) ? 0 : parsed,
          data: call,
        });
      }

      if (isTest || calls.length < limit || !response.body.meta?.next) {
        break;
      }

      // Plivo returns inbound calls newest first, so once a page ends at or before the
      // last poll there is nothing newer left on the pages behind it.
      // A record with neither timestamp lands on 0, which must not be read as
      // older than the last poll or paging would stop while newer calls remain.
      const oldestOnPage = items[items.length - 1]?.epochMilliSeconds ?? 0;
      if (oldestOnPage > 0 && oldestOnPage <= lastFetchEpochMS) {
        break;
      }

      offset += limit;

      // Reaching the cap means older unseen calls remain. Failing here leaves the stored
      // watermark untouched, so the next poll retries the same window instead of skipping
      // past them, and the reason is visible rather than silent.
      if (page === MAX_PAGES - 1) {
        throw new Error(
          `More inbound calls completed than one poll can read (${
            MAX_PAGES * PAGE_SIZE
          }). No calls were skipped, and the next poll retries. Shorten the polling interval if this repeats.`
        );
      }
    }

    return items.filter(
      (item) => isTest || item.epochMilliSeconds > lastFetchEpochMS
    );
  },
};

export const plivoCompletedCall = createTrigger({
  auth: plivoAuth,
  name: 'completed_call',
  displayName: 'Completed Call',
  description: 'Triggers after an inbound call has ended, including calls that were never answered',
  aiMetadata: {
    description:
      'Fires after an inbound voice call to a Plivo number has ended. Deduplication is by end time, which Plivo reports to the second, so two calls ending in the same second can occasionally yield only one event. Each event is one finished call with its from/to numbers, state, duration, and hangup cause, including calls that were busy, failed, or never answered. It reads the call record on a schedule, so it cannot answer or control the call. Use New Incoming Call for that.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    answer_time: '2026-07-08 12:00:02+00:00',
    bill_duration: 12,
    billed_duration: 60,
    call_direction: 'inbound',
    call_duration: 12,
    call_state: 'ANSWER',
    call_uuid: '5607532d-5037-4066-befc-a8b40218dd4f',
    cnam_lookup: 'Not Applicable',
    conference_uuid: null,
    end_time: '2026-07-08 12:00:12+00:00',
    from_iso: 'US',
    from_number: '+14151234567',
    hangup_cause_code: 4000,
    hangup_cause_name: 'Normal Hangup',
    hangup_source: 'Callee',
    initiation_time: '2026-07-08 12:00:00+00:00',
    parent_call_uuid: null,
    post_dial_delay: null,
    resource_uri: '/v1/Account/MAXXXXXXXXXXXXXXXXXX/Call/5607532d-5037-4066-befc-a8b40218dd4f/',
    ring_duration: 2,
    source_ip: null,
    stir_attestation: 'A',
    stir_verification: 'Verified',
    to_iso: 'US',
    to_number: '+14157654321',
    total_amount: '0.00850',
    total_rate: '0.00850',
    voice_network_group: '',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

interface PlivoCall {
  call_uuid: string;
  from_number: string;
  to_number: string;
  call_direction: string;
  call_state?: string;
  call_duration?: number;
  initiation_time?: string;
  end_time?: string;
}

interface PlivoCallListResponse {
  api_id?: string;
  // The Call endpoint pages with next and previous and returns no total_count, unlike the
  // Number endpoint. Both are optional here because the code already guards for them.
  meta?: {
    limit?: number;
    offset?: number;
    next?: string | null;
    previous?: string | null;
  };
  objects?: PlivoCall[];
}
