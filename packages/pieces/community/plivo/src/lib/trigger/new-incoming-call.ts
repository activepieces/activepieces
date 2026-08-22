import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

const polling: Polling<AppConnectionValueForAuthProperty<typeof plivoAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTest = lastFetchEpochMS === 0;
    const authId = auth.username;

    const response = await httpClient.sendRequest<PlivoCallListResponse>({
      method: HttpMethod.GET,
      url: `https://api.plivo.com/v1/Account/${authId}/Call/`,
      queryParams: {
        call_direction: 'inbound',
        limit: isTest ? '1' : '20',
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: authId,
        password: auth.password,
      },
    });

    const calls = response.body.objects ?? [];
    return calls
      .map((call) => {
        const timestamp = call.end_time || call.initiation_time || '';
        return { epochMilliSeconds: timestamp ? new Date(timestamp).getTime() : 0, data: call };
      })
      .filter((item) => isTest || item.epochMilliSeconds > lastFetchEpochMS);
  },
};

export const plivoNewIncomingCall = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_call',
  displayName: 'New Incoming Call',
  description: 'Triggers when an inbound call completes.',
  aiMetadata: {
    description:
      'Fires when an inbound voice call to a Plivo number has completed. Each event is one finished inbound call with its from/to numbers, state, and duration. Polls the call record, so it fires after the call ends, not while it is ringing.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    call_uuid: '5607532d-5037-4066-befc-a8b40218dd4f',
    from_number: '+14151234567',
    to_number: '+14157654321',
    call_direction: 'inbound',
    call_state: 'ANSWER',
    call_duration: 12,
    initiation_time: '2026-07-08 12:00:00+00:00',
    end_time: '2026-07-08 12:00:12+00:00',
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
  api_id: string;
  meta: { limit: number; offset: number; total_count: number };
  objects: PlivoCall[];
}
